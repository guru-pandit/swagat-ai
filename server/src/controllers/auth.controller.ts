import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
    /** POST /api/auth/login */
    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json({ success: true, data: result });
    },

    /** POST /api/auth/refresh */
    async refresh(req: Request, res: Response) {
        const result = await authService.rotate(req.body.refreshToken);
        res.json({ success: true, data: result });
    },

    /** POST /api/auth/logout */
    async logout(req: Request, res: Response) {
        await authService.logout(req.body.refreshToken);
        res.json({ success: true, data: { signedOut: true } });
    },

    /** GET /api/auth/me - authUser is populated by the JWT authentication middleware */
    async me(req: Request, res: Response) {
        const user = await authService.currentUser(req.authUser!.userId);
        res.json({ success: true, data: user });
    }
}
