import { Request, Response } from 'express';
import { notificationModel } from '../models';

export const notificationController = {
    /** GET /api/notifications - returns the caller's last 50 notification */
    async list(req: Request, res: Response) {
        const data = await notificationModel.listForUser(req.authUser!.userId);
        res.json({ success: true, data });
    }
}
