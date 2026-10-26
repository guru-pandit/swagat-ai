export const HTTP_STATUS = {
    OK: 'ok',
    ERROR: 'error',
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const HTTP_STATUS_CODE = {
    // 2xx — Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // 3xx — Redirection
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,

    // 4xx — Client errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    GONE: 410,
    CONTENT_TOO_LARGE: 413,
    UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_CONTENT: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx — Server errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS_CODE)[keyof typeof HTTP_STATUS_CODE];
