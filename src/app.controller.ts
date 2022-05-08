import * as Bunyan from 'bunyan';

import { Controller, Get, Inject, Put } from '@nestjs/common';

import { AppService } from './app.service';
import { ReqLogger } from './logging/request-logger.factory';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, @ReqLogger() private readonly logger: Bunyan)
    {}

    @Get()
    getHello(): string {
        this.logger.trace({  }, 'trace message');
        this.logger.debug({  }, 'debug message');
        this.logger.info({  }, 'info message');
        this.logger.warn({  }, 'warn message');
        this.logger.error({  }, 'error message');
        this.logger.fatal({  }, 'fatal message');
        return this.appService.getHello();
    }
}
