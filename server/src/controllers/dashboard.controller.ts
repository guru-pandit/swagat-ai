import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
    // GET /api/dashboard/summary
    async summary(req: Request, res: Response) {
        const date = typeof req.query.date === 'string' ? req.query.date : undefined;
        const offset = typeof req.query.timezoneOffset === 'string' ? Number(req.query.timezoneOffset) : 0;
        const data = await dashboardService.summary(date, Number.isFinite(offset) ? offset : 0, req.authUser!);
        res.json({ success: true, data });
    }
}
