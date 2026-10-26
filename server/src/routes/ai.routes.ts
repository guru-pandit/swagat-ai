import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { aiController } from '../controllers/ai.controller';

export const aiRouter = Router();

aiRouter.post('/chat', asyncHandler(aiController.chat));
aiRouter.get('/stream', asyncHandler(aiController.stream));