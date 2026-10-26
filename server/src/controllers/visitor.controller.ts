import { Request, Response } from 'express';
import { visitorService } from '../services/visitor.service';
import { HTTP_STATUS_CODE } from '../constants'

export const visitorController = {
    /** POST /api/visitors/checkin */
    async checkIn(req: Request, res: Response) {
        // The public kiosk must never be able to impersonate a staff member or set server-owned fields.
        const { fullName, company, email, phone, photoUrl, hostId, notes } = req.body;
        const data = await visitorService.checkIn({ fullName, company, email, phone, photoUrl, hostId, notes });
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, data });
    },

    /** POST /api/visitors/staff-checkin - records which staff member registered the guest. */
    async staffCheckIn(req: Request, res: Response) {
        const data = await visitorService.checkIn({ ...req.body, checkedInById: req.authUser!.userId });
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, data });
    },

    /** GET /api/visitors/ */
    async list(req: Request, res: Response) {
        const date = typeof req.query.date === 'string' ? req.query.date : undefined;
        const rawOffset = typeof req.query.timezoneOffset === 'string' ? Number(req.query.timezoneOffset) : 0;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const data = await visitorService.list({ date, timezoneOffset: Number.isFinite(rawOffset) ? rawOffset : 0, status }, req.authUser!);
        res.json({ success: true, data });
    },

    /** PATCH /api/visitors/:visitId/checkout */
    async checkOut(req: Request, res: Response) {
        const data = await visitorService.checkOut(req.params.visitId, req.authUser!);
        res.json({ success: true, data });
    }
}
