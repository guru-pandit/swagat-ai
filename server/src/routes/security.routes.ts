import { Router } from 'express';
import { securityController } from '../controllers/security.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';

export const securityRouter = Router();
securityRouter.use(authenticate);

/** Watchlist management is limited to the roles that run the reception desk. */
securityRouter.get('/watchlist',
    requireRole('RECEPTIONIST', 'ADMIN'),
    asyncHandler(securityController.getWatchlist));

/** NDA signing — open to any authenticated user */
securityRouter.post('/nda', asyncHandler(securityController.signNda));
