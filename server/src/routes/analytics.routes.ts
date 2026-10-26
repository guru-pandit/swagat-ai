import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, requireRole('ADMIN', 'RECEPTIONIST'));

analyticsRouter.get('/summary',   asyncHandler(analyticsController.summary));
analyticsRouter.get('/top-hosts', asyncHandler(analyticsController.topHosts));