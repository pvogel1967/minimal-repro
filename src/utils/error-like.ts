export interface ErrorLike {
    cause?: ErrorLike;
    code?: string;
    message: string;
    name?: string;
    signal?: string;
    stack?: string;
}

export function isErrorLike(err: unknown): err is ErrorLike {
    if (err === undefined || err === null) {
        return false;
    }
    const asObject = err as { [key: string]: any };
    return (
        (asObject.cause === undefined || isErrorLike(asObject.cause)) &&
        (asObject.code === undefined || typeof asObject.code === 'string') &&
        typeof asObject.message === 'string' &&
        (asObject.name === undefined || typeof asObject.name === 'string') &&
        (asObject.signal === undefined || typeof asObject.signal === 'string') &&
        (asObject.stack === undefined || typeof asObject.stack === 'string')
    );
}
