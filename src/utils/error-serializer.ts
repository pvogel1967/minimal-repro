import * as stringify from 'json-stringify-safe';

import { HttpException } from '@nestjs/common';

import { ErrorLike, isErrorLike } from './error-like';
import { isHttpException, isHttpExceptionLike } from './is-http-exception';

export interface ErrorRecord {
    cause?: ErrorRecord;
    code?: string | number;
    message: string;
    name?: string;
    signal?: string | number;
    stack: Array<string>;
}
export interface HttpExceptionRecord extends ErrorRecord {
    httpStatus: number;
    response: string | any;
}

export const stackStringToArray = (stackString: string | undefined): Array<string> =>
    stackString?.split('\n').map((line) => line.trim()) || [];

export function isHttpExceptionRecord(data: any) {
    return typeof data.httpStatus === 'number' && typeof data.response === 'string';
}

export function serializeHttpException(err: HttpException): string {
    const errorRecord = errorSerializer(err);
    const httpExceptionRecord: HttpExceptionRecord = {
        ...errorRecord,
        httpStatus: err.getStatus(),
        response: err.getResponse(),
    };
    return JSON.stringify(httpExceptionRecord);
}

export function deserializeHttpException(serialized: string): HttpException {
    const deserialized: any = JSON.parse(serialized);
    if (!isHttpExceptionRecord(deserialized)) {
        throw new Error('Invalid http exception record');
    }
    return new HttpException(deserialized.response, deserialized.httpStatus);
}

export function errorSerializer(err: unknown): ErrorRecord {
    if (err == null) {
        return errorSerializer(new Error('Null or undefined object passed into errorSerializer'));
    }
    if (typeof err === 'string') {
        return {
            message: err,
            stack: [],
        };
    }
    if (err instanceof HttpException || isHttpException(err) || isHttpExceptionLike(err)) {
        const e = err as HttpException;
        return {
            code: e.getStatus(),
            message: e.message,
            name: e.constructor.name,
            stack: stackStringToArray(e.stack),
        };
    }
    if (isErrorLike(err)) {
        const e = err as ErrorLike;
        return {
            ...(e.cause && { cause: errorSerializer(e.cause) }),
            ...(e.code && { code: String(e.code) }),
            message: e.message,
            ...(e.name && { name: String(e.name) }),
            ...(e.signal && { signal: String(e.signal) }),
            stack: stackStringToArray(e.stack),
        };
    }
    return {
        message: `Unknown err passed into errorSerializer: ${stringify(err)}`,
        stack: [],
    };
}
