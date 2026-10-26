import { Request, Response } from 'express';
import { securityService } from '../services/security.service';

export const securityController = {
    async getWatchlist(_req: Request, res: Response) {
        const data = await securityService.getWatchlist();
        res.json({ success: true, data });
    },
    async signNda(req: Request, res: Response) {
        // Pass only the NDA fields needed by the service, plus the request's network address.
        const data = await securityService.signNda(req.body.visitorId, req.body.signature, req.ip ?? '');
        res.status(201).json({ success: true, data });
    },
};
