import { Request, Response } from 'express';
import { packageService } from '../services/package.service';
import { HTTP_STATUS_CODE } from '../constants'

export const packageController = {
    /** POST /api/packages/ */
    async log(req: Request, res: Response) {
        // The logged-by identity comes from the verified token, never from client input.
        const data = await packageService.log({ ...req.body, loggedById: req.authUser!.userId });
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, data });
    },

    /** PATCH /api/packages/:id/collect */
    async collect(req: Request, res: Response) {
        const data = await packageService.collect(req.params.id);
        res.json({ success: true, data });
    },

    /** GET /api/packages/pending */
    async pending(req: Request, res: Response) {
        const data = await packageService.pending();
        res.json({ success: true, data });
    }
}
