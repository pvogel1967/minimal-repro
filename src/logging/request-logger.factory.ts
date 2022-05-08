import * as Bunyan from 'bunyan';
import { levelFromName, nameFromLevel } from 'bunyan';
import { Request } from 'express';

import { Inject } from '@nestjs/common';
import { Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { InjectorKeys } from '@eropple/nestjs-bunyan';

const HY_ROWER_ID_HEADER = 'sample-rower-id';
const HY_TABLET_SN_HEADER = 'sample-tablet-sn';
import { LOGGING_CONFIG_INJECTOR, LoggingConfig } from './logging.config';

export const REQ_LOGGER = 'REQ_LOGGER';

export const RequestLoggerFactory = {
    provide: REQ_LOGGER,
    scope: Scope.REQUEST,
    inject: [InjectorKeys.LOGGER, REQUEST, LOGGING_CONFIG_INJECTOR],
    useFactory: async (baseLogger: Bunyan, request: Request, loggingConfig: LoggingConfig) => {
        const rowerIdHeader =
            request?.headers &&
            request.headers[HY_ROWER_ID_HEADER] &&
            typeof request.headers[HY_ROWER_ID_HEADER] === 'string'
                ? (request.headers[HY_ROWER_ID_HEADER] as string)
                : null;
        const tabletSnHeader =
            request?.headers &&
            request.headers[HY_TABLET_SN_HEADER] &&
            typeof request.headers[HY_TABLET_SN_HEADER] === 'string'
                ? (request.headers[HY_TABLET_SN_HEADER] as string)
                : null;

        const logLevelsForRequest: Array<string> = [];
        if (request?.route?.path && request.route.path in loggingConfig.routeLevels) {
            logLevelsForRequest.push(loggingConfig.routeLevels[request.route.path]);
        }
        if (rowerIdHeader) {
            const rowerId = parseInt(rowerIdHeader, 10);
            if (rowerId in loggingConfig.rowerLevels) {
                logLevelsForRequest.push(loggingConfig.rowerLevels[rowerId]);
            }
        }
        if (tabletSnHeader && tabletSnHeader in loggingConfig.tabletSnLevels) {
            logLevelsForRequest.push(loggingConfig.tabletSnLevels[tabletSnHeader]);
        }
        logLevelsForRequest.forEach((logLevelString) => {
            if (logLevelString) {
                const level = logLevelString as Bunyan.LogLevelString;
                setLevelIfLower(baseLogger, level);
            }
        });
        return baseLogger;
    },
};

// HATE redefining this here, but if I try to export from logging.ts we get
// `TypeError: req_logger_provider_1.ReqLogger is not a function` errors.  Seems like a TS compiler bug?
function setLevelIfLower(logger: Bunyan, targetLevel: Bunyan.LogLevel): void {
    const existingLevelNumber = logger.level();
    const targetLevelNumber = typeof targetLevel === 'string' ? levelFromName[targetLevel] : targetLevel;
    if (targetLevelNumber < existingLevelNumber) {
        logger.trace(`setLevelIfLower: setting log level to "${targetLevel}"`);
        logger.level(targetLevelNumber);
    } else {
        logger.trace(
            `setLevelIfLower: skipping: target level "${targetLevel}" is lower than existing level ${nameFromLevel[existingLevelNumber]}`,
        );
    }
}

export function ReqLogger() {
    return Inject(REQ_LOGGER);
}
