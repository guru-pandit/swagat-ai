import { PrismaClient } from '../generated/prisma/client.js';

// globalThis keeps the same instance across hot-reloads in dev
// without this, each save create a new DB connection -> pool exhausted
const g = globalThis as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient({
    log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;