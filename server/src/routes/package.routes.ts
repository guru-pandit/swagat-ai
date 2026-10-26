import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { packageController } from '../controllers/package.controller';

export const packageRouter = Router();
packageRouter.use(authenticate, requireRole('ADMIN', 'RECEPTIONIST'));

packageRouter.post('/', asyncHandler(packageController.log));
packageRouter.patch('/:id/collect', asyncHandler(packageController.collect));
packageRouter.get('/pending', asyncHandler(packageController.pending));
