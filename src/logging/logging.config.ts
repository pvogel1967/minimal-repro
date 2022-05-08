import * as Bunyan from 'bunyan';
import * as Joi from 'joi';

import { FactoryProvider, Scope } from '@nestjs/common';
import { ROOT_LOGGER } from '@eropple/nestjs-bunyan/dist';

const LevelStringSchema = Joi.string()
    .allow('trace', 'debug', 'info', 'warn', 'error', 'fatal')
    .default('info')
    .required();
const LoggingConfigSchema = Joi.object({
    level: LevelStringSchema,
    sampleRate: Joi.number().min(0).max(100).default(10).required(),
    rowerLevels: Joi.object().pattern(/^\d+/, LevelStringSchema).optional(),
    tabletSnLevels: Joi.object().pattern(/^/, LevelStringSchema).optional(),
    routeLevels: Joi.object()
        .pattern(/^\/[a-z0-9-_/]*$/, LevelStringSchema)
        .optional(),
});

export interface LoggingConfig {
    level: string;
    sampleRate: number;
    rowerLevels: { [key: number]: string };
    tabletSnLevels: { [key: string]: string };
    routeLevels: { [key: string]: string };
}

export const LOGGING_CONFIG_INJECTOR = 'LoggingConfig';
export const LoggingConfigProvider: FactoryProvider = {
    provide: LOGGING_CONFIG_INJECTOR,
    scope: Scope.DEFAULT,
    inject: [ROOT_LOGGER],
    useFactory: async (rootLogger) => {
        const config = new LoggingConfigHandler(rootLogger);
        await config.init();
        return config;
    },
};

class LoggingConfigHandler implements LoggingConfig {
    #config: LoggingConfig = {
        level: 'info',
        sampleRate: 10,
        rowerLevels: {},
        tabletSnLevels: {},
        routeLevels: {},
    };
    #isInitialized: boolean = false;
    readonly #logger: Bunyan;

    constructor(rootLogger: Bunyan) {
        this.#logger = rootLogger.child('LoggingConfigHandler');
    }

    async init(): Promise<void> {
        if (!this.#isInitialized) {
            // in real code I'm doing some async stuff here to talk to consul
            this.#isInitialized = true;
        }
    }

    public get level(): string {
        if (!this.#isInitialized) {
            this.#logger.warn({ field: 'level' }, `Accessing LoggingConfig before LoggingConfigHandler is initialized`);
        }
        return this.#config.level;
    }

    public get sampleRate(): number {
        if (!this.#isInitialized) {
            this.#logger.warn(
                { field: 'sampleRate' },
                `Accessing LoggingConfig before LoggingConfigHandler is initialized`,
            );
        }
        return this.#config.sampleRate;
    }

    public get rowerLevels(): { [key: number]: string } {
        if (!this.#isInitialized) {
            this.#logger.warn(
                `{ field: 'rowerLevels' }, Accessing LoggingConfig before LoggingConfigHandler is initialized`,
            );
        }
        return this.#config.rowerLevels;
    }

    public get tabletSnLevels(): { [key: string]: string } {
        if (!this.#isInitialized) {
            this.#logger.warn(
                { field: 'tabletSnLevels' },
                `Accessing LoggingConfig before LoggingConfigHandler is initialized`,
            );
        }
        return this.#config.tabletSnLevels;
    }

    public get routeLevels(): { [key: string]: string } {
        if (!this.#isInitialized) {
            this.#logger.warn(
                { field: 'routeLevels' },
                `Accessing LoggingConfig before LoggingConfigHandler is initialized`,
            );
        }
        return this.#config.routeLevels;
    }

    public toJSON(): LoggingConfig {
        return this.#config;
    }
}
