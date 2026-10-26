import { prisma } from '../lib/prisma';

export const analyticsService = {
    async summary(from: Date, to: Date) {
        const where = { checkedInAt: { gte: from, lte: to } };
        const [total, checkedIn, byStatus, byHour] = await Promise.all([
            prisma.visitLog.count({ where }),
            prisma.visitLog.count({ where: { ...where, status: 'CHECKED_IN' } }),
            prisma.visitLog.groupBy({ by: ['status'], where, _count: true }),
            // Keep the SQL column name aligned with the current Prisma schema.
            prisma.$queryRaw<{ hour: number; count: bigint }[]>`
                SELECT EXTRACT(HOUR FROM "checkedInAt") AS hour, COUNT(*) AS count
                FROM "VisitLog"
                WHERE "checkedInAt" BETWEEN ${from} AND ${to}
                GROUP BY hour ORDER BY hour
            `,
        ]);

        return {
            total,
            checkedIn,
            byStatus: byStatus.map(row => ({ status: row.status, count: row._count })),
            byHour: byHour.map(row => ({ hour: Number(row.hour), count: Number(row.count) })),
        };
    },

    async topHosts(from: Date, to: Date) {
        // Host ownership lives on Visitor, so count each visit under that visitor's host.
        const visits = await prisma.visitLog.findMany({
            where: { checkedInAt: { gte: from, lte: to } },
            select: { visitor: { select: { hostId: true, host: { select: { displayName: true } } } } },
        });
        const counts = new Map<string, { hostId: string; name: string; visits: number }>();
        for (const { visitor } of visits) {
            const entry = counts.get(visitor.hostId) ?? { hostId: visitor.hostId, name: visitor.host.displayName, visits: 0 };
            entry.visits += 1;
            counts.set(visitor.hostId, entry);
        }
        return [...counts.values()].sort((a, b) => b.visits - a.visits).slice(0, 10);
    },
};
