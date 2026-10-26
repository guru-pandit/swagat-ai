import { Request, Response, NextFunction } from 'express';

import { HTTP_STATUS_CODE } from '../constants/http';
import { logger } from '../lib/logger';

// Throw this anywhere: throw new AppError('Not Found', 404)
export class AppError extends Error {
    constructor(
        public override message: string,
        public statusCode: string | number = 500,
        public code?: string
    ) {
        super(message)
    }
}

// Add as the LAST app.use() in index.ts -> after all routes
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    const prod = process.env.NODE_ENV === 'production';

    if (err instanceof AppError) {
        return res
            .status(err.statusCode as number)
            .json({
                success: false,
                error: err.message,
                code: err.code
            })
    }

    logger.error({ err, stack: err.stack }, 'Unhandled error');

    return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
            success: false,
            error: prod ? 'Something went wrong' : err.message,
            stack: prod ? undefined : err.stack
        })
}