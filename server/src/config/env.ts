import { z } from 'zod';

import { logger } from "../lib/logger";

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    PORT: z.string().transform(Number).default('3001'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32),
    CLIENT_URL: z.string().url(),
    SERVER_URL: z.string().url(),
    OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    logger.fatal({ errors: parsed.error.format() }, 'Missing or invalid env vars - server cannot start');
    process.exit(1);
}

export const env = parsed.data;