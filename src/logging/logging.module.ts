import { Module } from '@nestjs/common';

import { LoggingConfigProvider } from './logging.config';
import { RequestTrackerFactory } from './request-interceptor.provider';
import { RequestLoggerFactory } from './request-logger.factory';

@Module({
    imports: [],
    providers: [LoggingConfigProvider, RequestTrackerFactory, RequestLoggerFactory],
    exports: [LoggingConfigProvider, RequestTrackerFactory, RequestLoggerFactory],
})
export class LoggingModule {}
