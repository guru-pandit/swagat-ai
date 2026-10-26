import { Resend } from 'resend';
import twilio from 'twilio';

import { notificationModel } from '../models';
import { io } from '../sockets';
import { logger } from '../lib/logger';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const twClient = env.TWILIO_ACCOUNT_SID ?
    twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN) : null

export const notificationService = {
    async email(
        to: string,
        subject: string,
        html: string,
        userId?: string
    ) {
        if (!resend) return logger.debug({ to, subject }, '[DEV Email skipped - no RESEND_API_KEY');
        await resend.emails.send({
            from: 'noreply@swagat.ai',
            to, subject, html
        });
        if (userId) await notificationModel.create({
            user: { connect: { id: userId } },
            channel: 'EMAIL',
            subject,
            body: html,
            Status: 'SENT',
            sentAt: new Date()
        });
    },

    async sms(to: string, body: string) {
        if (!twClient || !env.TWILIO_PHONE_NUMBER)
            return logger.debug({ to, body }, '[DEV] SMS skipped — no Twilio credentials');
        await twClient.messages.create({ from: env.TWILIO_PHONE_NUMBER, to, body });
    },

    socket(userId: string, event: string, data: unknown) {
        io.to(`user:${userId}`).emit(event, data);
    },

    async all(opts: {
        userId: string;
        email: string;
        phone?: string;
        subject: string;
        html: string;
        smsBody: string;
        event: string;
        data: unknown;
    }) {
        // Wait for every channel attempt so the caller can observe when delivery work has finished.
        await Promise.allSettled([
            this.email(opts.email, opts.subject, opts.html, opts.userId),
            opts.phone ? this.sms(opts.phone, opts.smsBody) : Promise.resolve(),
            Promise.resolve(this.socket(opts.userId, opts.event, opts.data)),
        ]);
    }
}
