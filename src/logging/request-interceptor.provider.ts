import { FactoryProvider, Scope } from '@nestjs/common/interfaces';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Bunyan } from '@eropple/nestjs-bunyan';
import { ROOT_LOGGER } from '@eropple/nestjs-bunyan';

import { RequestTrackerInterceptor } from './request-tracker.interceptor';
import { LOGGING_CONFIG_INJECTOR, LoggingConfig } from './logging.config';
export const RequestTrackerFactory: FactoryProvider = {
    provide: APP_INTERCEPTOR,
    scope: Scope.REQUEST,
    inject: [ROOT_LOGGER, LOGGING_CONFIG_INJECTOR],
    useFactory: (logger: Bunyan, config: LoggingConfig) => {
        console.log('In requestInterceptorProvider factory');
        return new RequestTrackerInterceptor(logger, config);
    },
};
