import { createClient } from 'redis';

import { env } from '../config/env';
import { logger } from './logger';

export const redis = createClient({
    url: env.REDIS_URL
});

redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
redis.on('connect', () => logger.info('Redis connected'));

// Call once at startup - (index.ts)
export async function connectRedis() {
    await redis.connect();
}

// Store a string for N seconds (used for OTPs, rate-limit counters)
export const setex = (key: string, secs: number, val: string) =>
    redis.setEx(key, secs, val);

// Read once then delete (OTP validation - can only be used once)
export const getdel = (key: string) =>
    redis.getDel(key);