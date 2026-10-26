import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

import { redis } from '../lib/redis';
import { userModel } from '../models';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS_CODE, MESSAGES } from '../constants';


const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
// A one-time dummy hash gives unknown accounts the same bcrypt comparison work as real accounts.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(32).toString('hex'), 12);

export const authService = {
    async login(email: string, password: string) {
        const user = await userModel.findByEmail(email);

        // Spend password-hash work even for unknown emails so account existence is harder to infer by timing.
        const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const valid = await bcrypt.compare(password, passwordHash);
        if (!user || !user.isActive || !valid) throw new AppError(
            MESSAGES.INVALID_CREDENTIALS,
            HTTP_STATUS_CODE.UNAUTHORIZED
        );

        return {
            accessToken: this.signAccess(user.id, user.role),
            refreshToken: await this.createRefresh(user.id),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                displayName: user.displayName
            }
        };
    },

    // Short-lived (15 min) - stored in memory on the client
    signAccess(userId: string, role: string): string {
        return jwt.sign(
            { userId, role },
            env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    },

    // Long-lived (7 days) - stored in httpOnly cookie
    async createRefresh(userId: string): Promise<string> {
        const token = randomBytes(40).toString('hex');
        await redis.setEx(`refresh:${token}`, REFRESH_TTL, userId);
        return token;
    },

    async logout(refreshToken?: string) {
        // Revoke the long-lived token in Redis so a copied session cannot be reused after sign-out.
        if (refreshToken) await redis.del(`refresh:${refreshToken}`);
    },

    // Called when access token expires - deletes old refresh, issues new pair
    async rotate(refreshToken: string) {
        const userId = await redis.getDel(`refresh:${refreshToken}`);
        if (!userId) throw new AppError(
            MESSAGES.SESSION_EXPIRED,
            HTTP_STATUS_CODE.UNAUTHORIZED
        );

        const user = await userModel.findById(userId);
        if (!user || !user.isActive) throw new AppError(
            MESSAGES.SESSION_EXPIRED,
            HTTP_STATUS_CODE.UNAUTHORIZED
        );

        return {
            accessToken: this.signAccess(user.id, user.role),
            refreshToken: await this.createRefresh(user.id),
        };
    },

    verifyAccess(token: string): { userId: string, role: string } {
        return jwt.verify(token, env.JWT_SECRET) as { userId: string, role: string }
    },

    async currentUser(userId: string) {
        const user = await userModel.findById(userId);
        if (!user || !user.isActive) throw new AppError(MESSAGES.SESSION_EXPIRED, HTTP_STATUS_CODE.UNAUTHORIZED);
        // Never send password hashes or internal account fields to the browser.
        return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, avatarUrl: user.avatar };
    },
}
