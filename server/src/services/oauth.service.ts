import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { userModel } from '../models';
import { authService } from './auth.service';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS_CODE, MESSAGES } from '../constants';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const oauthService = {
    /** Verify Google identity, then issue tokens only for an existing staff account. */
    async googleLogin(idToken: string) {
        if (!env.GOOGLE_CLIENT_ID || !idToken) {
            throw new AppError('Google sign-in is not configured.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            throw new AppError('Google account email is not verified.', HTTP_STATUS_CODE.UNAUTHORIZED);
        }

        // Do not create privileged staff accounts from public Google sign-in.
        const user = await userModel.findByEmail(payload.email);
        if (!user || !user.isActive) {
            throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS_CODE.UNAUTHORIZED);
        }

        return {
            accessToken: authService.signAccess(user.id, user.role),
            refreshToken: await authService.createRefresh(user.id),
            user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName },
        };
    },
};
