import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { notificationController } from '../controllers/notification.controller';

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get('/', asyncHandler(notificationController.list));