import * as path from 'path';

import { ConfigModule } from 'nestjs-config';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { LoggingModule as NestjsBunyanLoggingModule } from '@eropple/nestjs-bunyan';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SECURITY_CRITICAL_HEADERS } from './constants';
import { configureRequestLogger } from './logging/logging';
import { rootLogger } from './logging/root-logger';
import { LoggingModule } from './logging/logging.module';

@Module({
    imports: [
        // system-level modules, logging needs to come FIRST
        NestjsBunyanLoggingModule.forRoot(rootLogger, {
            skipRequestInterceptor: true, // we use our own request tracker from our own logging module
            dropHeaders: SECURITY_CRITICAL_HEADERS,
            postRequestCreate: configureRequestLogger,
        }),
        ConfigModule.load(path.resolve(__dirname, '..', 'config', '**', '*.js')),
        LoggingModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
