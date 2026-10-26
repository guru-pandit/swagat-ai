import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { visitorController } from '../controllers/visitor.controller';

export const visitorRouter = Router();

visitorRouter.post('/checkin', asyncHandler(visitorController.checkIn));
visitorRouter.post('/staff-checkin', authenticate, requireRole('ADMIN', 'RECEPTIONIST'), asyncHandler(visitorController.staffCheckIn));
visitorRouter.get('/', authenticate, requireRole('ADMIN', 'RECEPTIONIST'), asyncHandler(visitorController.list));
visitorRouter.patch('/:visitId/checkout', authenticate, asyncHandler(visitorController.checkOut));
