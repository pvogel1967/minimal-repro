/**
 * This is the deny list of headers that should never be logged anywhere
 * (logger, bugsnag, etc).
 */
export const SECURITY_CRITICAL_HEADERS: Array<string> = [
    'password',
    'authorization',
    'access_token',
];

