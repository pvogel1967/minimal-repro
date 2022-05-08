import * as Bunyan from 'bunyan';
import { levelFromName, nameFromLevel } from 'bunyan';
import { Request } from 'express';

// import { StringTo } from '@eropple/nestjs-auth';
// import { HY_INTERNAL_USER_HEADER } from '../authx/identity-utils';
// import { EventPayload } from '../queue-producer/event-data-types/event-payload';
import { envOrFallback } from '../utils/env';

export const LOG_LEVEL_HEADER_NAME = 'x-hydrow-log-level';

export function configureRequestLogger(logger: Bunyan, request: Request) {
    // We set the log level from env to handle the case where the value has changed at runtime
    configureLoggerFromEnv(logger);
    configureLoggerFromRequest(logger, request);
    if (!request?.params) {
        // This DOES happen with non http (i.e. Redis PubSub microservice) requests
        logger.trace('configureRequestLogger: No request or request params received?');
        return {};
    }
    const ret: { [key: string]: any } = {};
    ret.rowerId = request.params.rowerId ? parseInt(request.params.rowerId, 10) : undefined;
    ret.workoutId = request.params.workoutId ? parseInt(request.params.workoutId, 10) : undefined;
    if (request?.header && request.header('HY_INTERNAL_USER_HEADER')) {
        const [_a, oidcTokenSalt, _b] = request.header('HY_INTERNAL_USER_HEADER')!.split('_');
        ret.identity = { oidcTokenSalt };
    }
    return ret;
}

// This modifies the behavior of the logger that is passed to it, and only returns the logger param for fluency
export function configureLoggerFromEnv(logger: Bunyan): Bunyan {
    // We have to reference the env var directly here as we instantiate the root logger (which uses this) before the config service exists
    const logLevelFromEnv = envOrFallback('SERVICE_LOG_LEVEL', 'fatal').trim().toLocaleLowerCase();
    if (isBunyanLogLevel(logLevelFromEnv)) {
        logger.trace(`configureLoggerFromEnv: setting log level to SERVICE_LOG_LEVEL env value "${logLevelFromEnv}"`);
        logger.level(logLevelFromEnv);
    } else {
        if (logLevelFromEnv) {
            logger.warn(`configureLoggerFromEnv: DAPIV2_LOG_LEVEL value "${logLevelFromEnv}" is not valid in Bunyan`);
        }
        logger.trace(`configureLoggerFromEnv: setting request logger's log level to default value "info"`);
        logger.level('info');
    }
    return logger;
}

// This modifies the behavior of the logger that is passed to it
function configureLoggerFromRequest(logger: Bunyan, request: Request) {
    // Next, allow the client to override any log level with a request header
    // let eventPayload: EventPayload | null = null;
    let eventPayload: any | null;
    if (request && request.hasOwnProperty('pattern')) {
        // redis Pub/Sub event from QueueProducerService
        try {
            const eventRequest = request as any;
            if ((eventRequest.data as string) === '') {
                return logger;
            }
            eventPayload = JSON.parse(eventRequest.data) as any;
            logger.fields = { ...logger.fields, ...eventPayload.fields }; // ensures the same correlation ID, etc. carry forward.
        } catch (err) {
            logger.error({ request, err }, 'configureLoggerFromRequest: request has unexpected format');
        }
    }
    const logLevelHeaderValue: string | Array<string> | number | undefined = eventPayload
        ? eventPayload.level
        : request?.header
        ? request?.header(LOG_LEVEL_HEADER_NAME)
        : undefined;
    const logLevelFromHeaderOrRequest: string | number | undefined = Array.isArray(logLevelHeaderValue)
        ? logLevelHeaderValue[logLevelHeaderValue.length - 1]
        : logLevelHeaderValue;
    const logLevel =
        typeof logLevelFromHeaderOrRequest === 'string'
            ? logLevelFromHeaderOrRequest?.trim()?.toLocaleLowerCase()
            : logLevelFromHeaderOrRequest;
    if (isBunyanLogLevel(logLevel)) {
        logger.trace(
            `configureLoggerFromRequest: ${LOG_LEVEL_HEADER_NAME} header value or async event payload value is "${logLevel}"`,
        );
        setLevelIfLower(logger, logLevel);
    } else if (logLevel) {
        logger.warn(
            `configureLoggerFromRequest: ${LOG_LEVEL_HEADER_NAME} header value or async event payload value "${logLevel}" is not valid in Bunyan`,
        );
    }
    return logger;
}

function setLevelIfLower(logger: Bunyan, targetLevel: Bunyan.LogLevel): void {
    const existingLevelNumber = logger.level();
    const targetLevelNumber = typeof targetLevel === 'string' ? levelFromName[targetLevel] : targetLevel;
    if (targetLevelNumber < existingLevelNumber) {
        logger.warn(`setLevelIfLower: setting log level to "${targetLevel}"`);
        logger.level(targetLevelNumber);
    } else {
        logger.trace(
            `setLevelIfLower: skipping: target level "${targetLevel}" is lower than existing level ${nameFromLevel[existingLevelNumber]}`,
        );
    }
}

const VALID_LOG_LEVEL_STRINGS = Object.keys(levelFromName);
const VALID_LOG_LEVEL_NUMBERS = Object.values(levelFromName);
export function isBunyanLogLevel(value: unknown): value is Bunyan.LogLevel {
    return (
        (typeof value === 'string' && VALID_LOG_LEVEL_STRINGS.includes(value)) ||
        (typeof value === 'number' && VALID_LOG_LEVEL_NUMBERS.includes(value))
    );
}
