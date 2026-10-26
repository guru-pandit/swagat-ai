import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { appointmentController } from '../controllers/appointment.controller';

export const appointmentRouter = Router();
appointmentRouter.use(authenticate);

appointmentRouter.post('/', asyncHandler(appointmentController.create));
appointmentRouter.post('/:id/checkin', asyncHandler(appointmentController.checkIn));
appointmentRouter.get('/mine', asyncHandler(appointmentController.listForHost));
