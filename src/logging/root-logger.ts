import * as Bunyan from 'bunyan';
import * as os from 'os';

import { envOrFail } from '../utils/env';
import { errorSerializer } from '../utils/error-serializer';
import { configureLoggerFromEnv } from './logging';

export const rootLogger = configureLoggerFromEnv(
    Bunyan.createLogger({
        name: envOrFail('SERVICE_NAME'),
        hostname: generateDisplayedHostname(),
        serializers: { err: errorSerializer },
    }),
);

// We have to reference the env vars directly here as we instantiate the root logger before the config service exists
function generateDisplayedHostname() {
    if (process.env.NODE_ENV === 'local') {
        return `local.${os.hostname()}`;
    }
    const release = process.env.CONTAINER_VERSION ?? 'UNKNOWN';
    const base = os.hostname().split('.')[0] ?? 'missing-hostname';
    return `${process.env.NODE_ENV}.${release}.${base}`;
}
