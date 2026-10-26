import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const userController = {
    /** Staff directory includes work email for front desk tasks such as package delivery. */
    async directory(_req: Request, res: Response) {
        const users = await prisma.user.findMany({
            where: { isActive: true, role: { not: 'KIOSK' } },
            select: { id: true, displayName: true, email: true, role: true },
            orderBy: { displayName: 'asc' },
        });
        res.json({ success: true, data: users });
    },

    /** Public kiosk list exposes only names and IDs needed to route a visitor to their host. */
    async hosts(_req: Request, res: Response) {
        const hosts = await prisma.user.findMany({
            where: { isActive: true, role: { not: 'KIOSK' } },
            select: { id: true, displayName: true },
            orderBy: { displayName: 'asc' },
        });
        res.json({ success: true, data: hosts });
    },
};
