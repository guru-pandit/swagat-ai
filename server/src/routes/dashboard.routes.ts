import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { dashboardController } from '../controllers/dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/summary', asyncHandler(dashboardController.summary));