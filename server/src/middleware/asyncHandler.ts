import { Request, Response, NextFunction } from 'express';

// Express handlers may resolve to a response object; only rejected promises need forwarding.
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Wrap every async route with this
// Usage: router.get('/path', asyncHandler(async(req, res) => { ... }))
export const asyncHandler = (fn: AsyncFn) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);
