import * as Bunyan from 'bunyan';

import { Controller, Get, Inject, Put } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService)
    {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }
}
