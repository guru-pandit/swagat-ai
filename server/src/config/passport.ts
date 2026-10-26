import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';
import { env } from './env';
import { userModel } from '../models';

export function configurePassport() {
    if (!env.GOOGLE_CLIENT_ID) return; // skip if not configured

    passport.use(new GoogleStrategy({
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${env.SERVER_URL}/api/auth/google/callback`,
    }, async (_at, _rt, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email in Google profile'));

            // Find or create the user — first-time sign-in auto-creates as EMPLOYEE
            let user = await userModel.findByEmail(email);
            if (!user) {
                user = await userModel.create({
                    email, username: email.split('@')[0], passwordHash: '',
                    displayName: profile.displayName,
                    avatar: profile.photos?.[0]?.value,
                    isActive: true
                });
            }
            done(null, user);
        } catch (e) { done(e as Error); }
    }));
}