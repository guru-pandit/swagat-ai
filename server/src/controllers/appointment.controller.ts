import { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import { HTTP_STATUS_CODE } from '../constants'

export const appointmentController = {
    /** POST /api/appointments */
    async create(req: Request, res: Response) {
        // Tie every booking to the authenticated host instead of trusting a hostId from the form.
        const data = await appointmentService.create(req.body, req.authUser!);
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, data });
    },

    /** POST /api/appointments/:id/checkin */
    async checkIn(req: Request, res: Response) {
        const data = await appointmentService.checkIn(req.params.id, req.authUser!);
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, data });
    },

    /** GET /api/appointments/mine */
    async listForHost(req: Request, res: Response) {
        const data = await appointmentService.listForHost(req.authUser!);
        res.json({ success: true, data });
    },
}
