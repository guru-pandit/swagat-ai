import { Router } from 'express';
import { Request, Response } from 'express';
import { reminderQueue } from '../workers/reminder.worker';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';

export const queueRouter = Router();
queueRouter.use(authenticate, requireRole('ADMIN'));

/** POST /api/queue/reminder — schedule a reminder job */
queueRouter.post('/reminder', asyncHandler(async (req: Request, res: Response) => {
    const { appointmentId, sendAt } = req.body;
    const delay = new Date(sendAt).getTime() - Date.now();
    const job = await reminderQueue.add(
        'send-reminder',
        { appointmentId },
        { delay: Math.max(delay, 0) }
    );
    res.status(202).json({ success: true, data: { jobId: job.id } });
}));