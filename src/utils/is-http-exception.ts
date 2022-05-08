import { HttpException } from '@nestjs/common';

export function isHttpException(err: unknown): err is HttpException {
    if (err === undefined || err === null) {
        return false;
    }
    const asObject = err as { [key: string]: any };
    return (
        typeof asObject.constructor?.name === 'string' &&
        typeof asObject.getResponse === 'function' &&
        ['string', 'object'].includes(typeof asObject.getResponse()) &&
        typeof asObject.getStatus === 'function' &&
        typeof asObject.getStatus() === 'number' &&
        typeof asObject.toString === 'function' &&
        typeof asObject.toString() === 'string' &&
        typeof asObject.message === 'string' &&
        typeof asObject.name === 'string' &&
        typeof asObject.stack === 'string'
    );
}

export interface HttpExceptionLike {
    constructor: { name: string };
    message: { error: string; message: string };
    status: number;
    stack: string;
}

export function isHttpExceptionLike(err: unknown): err is HttpExceptionLike {
    if (err === undefined || err === null) {
        return false;
    }
    const asObject = err as { [key: string]: any };
    return (
        !!asObject.message &&
        typeof asObject.message === 'object' &&
        typeof asObject.message.error === 'string' &&
        typeof asObject.message.message === 'string' &&
        typeof asObject.name === 'string' &&
        typeof asObject.stack === 'string' &&
        typeof asObject.status === 'number'
    );
}
