import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { userController } from '../controllers/user.controller';

export const userRouter = Router();

// The kiosk only needs names; the richer work directory stays behind staff authentication.
userRouter.get('/hosts', asyncHandler(userController.hosts));
userRouter.get('/directory', authenticate, requireRole('ADMIN', 'RECEPTIONIST'), asyncHandler(userController.directory));
