import * as Bunyan from 'bunyan';
import * as Express from 'express';
import { DateTime } from 'luxon';
import { ServerResponse } from 'node:http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { SECURITY_CRITICAL_HEADERS } from '../constants';
import { envBoolean } from '../utils/env';
import { LoggingConfig } from './logging.config';

export const TEST_NO_REQ_TRACKER = envBoolean('DAPIV2_TEST_NO_REQUEST_TRACKER');
@Injectable()
export class RequestTrackerInterceptor implements NestInterceptor {
    private readonly _logger: Bunyan;
    private readonly _dropHeaders: Array<string>;
    private readonly loggingConfig: LoggingConfig;

    constructor(rootLogger: Bunyan, loggingConfig: LoggingConfig) {
        // we want the logs we emit here to be info level, we want to make sure they ARE
        // emitted entirely under the control of this interceptor, not because other
        // config dials the overall system logging to warn/error, etc  Hence we hard-code
        // the level here to info so info logs are emitted appropriately
        this._logger = rootLogger.child({ component: 'RequestTracker', level: /* loggingConfig.level */ 'info' });
        // we want to protect from errors in the constant, so authorization is hard-forced and if the constant is
        // set to null or undefined we use an empty array.
        this._dropHeaders = ['authorization', ...(SECURITY_CRITICAL_HEADERS || [])].map((h) => h.toLowerCase());
        this.loggingConfig = loggingConfig;
    }

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const start = Date.now();
        const ctx = context.switchToHttp();
        const req = ctx.getRequest<Express.Request>();
        const res = ctx.getResponse<ServerResponse>();
        const method = req.method;
        const url = req.url;
        const route = req.route.path;
        // logic here is intentionally via ifs, because this is hit on *every* request, we don't want to go to redis
        // if we don't have to, so we cache data locally.  If it's not in the local cache, we check if there's a
        // temp value in cache, and cache that value locally.  If it's not in redis, then we use the default and
        // we don't check redis again for another minute.  So while this *could* be expressed via coalescing (i.e.:
        // const sampleRateString = this.cache.getCacheLocalString(...) || (await this.cache.redis.get(...) || DEFAULT_SAMPLE RATE)
        // we don't do that because that doesn't tell us whether the value came from redis or not.

        const data: { [key: string]: any } = {
            method,
            url,
            route,
            begin: DateTime.utc().toISO(),
        };

        data.ip = req.socket.remoteAddress;

        data.headers = { ...req.headers };

        for (const h of this._dropHeaders) {
            delete data.headers[h];
        }
        const shouldLog = !TEST_NO_REQ_TRACKER ? Math.random() < this.loggingConfig.sampleRate / 100 : false;
        shouldLog && this._logger.info({ request: 'start', ...data }, 'Request Start');

        return next.handle().pipe(
            tap(() => {
                if (shouldLog) {
                    const ms = Date.now() - start;
                    this._logger.info(
                        {
                            request: 'end',
                            code: res.statusCode,
                            ms,
                            method,
                            route,
                            url,
                            finish: DateTime.utc().toISO(),
                        },
                        'Request End',
                    );
                }
            }),
            catchError((err) => {
                if (TEST_NO_REQ_TRACKER) {
                    return throwError(() => err);
                }
                if (!shouldLog) {
                    // got an error, so make sure we belatedly log this request start
                    this._logger.info({ request: 'start', ...data }, 'Request Start');
                }
                const ms = Date.now() - start;
                this._logger.info(
                    {
                        request: 'end',
                        err,
                        code: err.status,
                        ms,
                        method,
                        route,
                        url,
                        finish: DateTime.utc().toISO(),
                    },
                    'Request End',
                );
                return throwError(() => err);
            }),
        );
    }
}
