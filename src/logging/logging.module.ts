import { Module } from '@nestjs/common';

import { LoggingConfigProvider } from './logging.config';
import { RequestTrackerFactory } from './request-interceptor.provider';

@Module({
    imports: [],
    providers: [LoggingConfigProvider, RequestTrackerFactory],
    exports: [LoggingConfigProvider, RequestTrackerFactory],
})
export class LoggingModule {}
