import { Request, Response, NextFunction } from 'express';

import { authService } from '../services/auth.service';
import { AppError } from './errorHandler';
import { HTTP_STATUS_CODE, MESSAGES } from '../constants';

// Use first on any protected route: router.get('/me', authenticate, handler)
export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new AppError(
        MESSAGES.NO_TOKEN,
        HTTP_STATUS_CODE.UNAUTHORIZED
    );

    try {
        req.authUser = authService.verifyAccess(token);
        next();
    } catch {
        throw new AppError(
            MESSAGES.INVALID_TOKEN,
            HTTP_STATUS_CODE.UNAUTHORIZED
        );
    }
}

// Use after authenticate() to restrict by role
// Example: router.delete('/:id', authenticate, requireRole('admin'), handler)
export function requireRole(...roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!roles.includes(req.authUser!.role)) throw new AppError(
            MESSAGES.INSUFFICIENT_PERMISSIONS,
            HTTP_STATUS_CODE.FORBIDDEN
        );
        next();
    };
}

// Shorthand combiners - import these in route files for readability
export const adminOnly = requireRole('ADMIN');
export const staffOnly = requireRole('ADMIN', 'RECEPTIONIST');
export const anyOnly = requireRole('ADMIN', 'RECEPTIONIST', 'EMPLOYEE');
