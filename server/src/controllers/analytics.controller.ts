import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const analyticsController = {
  async summary(req: Request, res: Response) {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(0);
    const to   = req.query.to   ? new Date(req.query.to   as string) : new Date();
    const data = await analyticsService.summary(from, to);
    res.json({ success: true, data });
  },

  async topHosts(req: Request, res: Response) {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(0);
    const to   = req.query.to   ? new Date(req.query.to   as string) : new Date();
    const data = await analyticsService.topHosts(from, to);
    res.json({ success: true, data });
  },
};