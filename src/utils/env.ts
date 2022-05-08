export function envOrFail(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`process.env.${key} must be set.`);
    }

    return value;
}

export function envOrFallback(key: string, fallback: string): string {
    return process.env[key] || fallback;
}

export function envIntOrFail(key: string): number {
    const envVar = envOrFail(key);

    const value = parseInt(envVar, 10);
    if (!value) {
        throw new Error(`process.env.${key} must be an integer.`);
    }

    return value;
}

export function envIntOrFallback(key: string, fallback: number): number {
    const envVar = process.env[key];
    let value: number;

    if (!envVar) {
        value = fallback;
    } else {
        value = parseInt(envVar, 10);
        if (!value) {
            throw new Error(`process.env.${key} must be an integer. Received: ${value}`);
        }
    }

    if (value !== Math.trunc(value)) {
        throw new Error(`Value available for ${key} (${value}) is not an integer.`);
    }

    return value;
}

export function envBoolean(key: string): boolean {
    const envVar: string = envOrFallback(key, 'false');
    return envVar === '1' || envVar.toLowerCase() === 'true';
}

export function isProd(): boolean {
    return process.env.NODE_ENV === 'prod';
}
