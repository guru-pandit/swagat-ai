import { Prisma, Visitor, VisitLog } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { BaseModel } from '../lib/base.model.js';

/**--------- Visitor ---------- */
class VisitorModel extends BaseModel<
    Visitor,
    Prisma.VisitorCreateInput,
    Prisma.VisitorUpdateInput,
    Prisma.VisitorWhereUniqueInput,
    Prisma.VisitorWhereInput,
    Prisma.VisitorOrderByWithRelationInput
> {
    constructor() {
        super(prisma.visitor);
    }
}

export const visitorModel = new VisitorModel();

/**--------- VisitLog ---------- */
class VisitLogModel extends BaseModel<
    VisitLog,
    Prisma.VisitLogCreateInput,
    Prisma.VisitLogUpdateInput,
    Prisma.VisitLogWhereUniqueInput,
    Prisma.VisitLogWhereInput,
    Prisma.VisitLogOrderByWithRelationInput
> {
    constructor() {
        super(prisma.visitLog);
    }

    /** Mark checked-out and record timestamp */
    checkout(id: string) {
        return this.db.update({
            where: { id },
            data: { checkedOutAt: new Date(), status: "CHECKED_OUT" },
        });
    }

    /** Filtered list - status + date both optional */
    list(filters: {
        status?: string,
        date?: string,
        timezoneOffset?: number,
        hostId?: string,
    }) {
        // Convert the selected local calendar date to UTC using the browser's offset.
        const match = filters.date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const localMidnightUtc = match
            ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + (filters.timezoneOffset ?? 0) * 60_000
            : undefined;
        const day = localMidnightUtc === undefined ? undefined : new Date(localMidnightUtc);
        const nextDay = day ? new Date(day.getTime() + 24 * 60 * 60 * 1000) : undefined;
        return this.db.findMany({
            where: {
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.hostId ? { visitor: { hostId: filters.hostId } } : {}),
                ...(day ? { checkedInAt: { gte: day, lt: nextDay } } : {})
            },
            include: { visitor: { include: { host: true } } },
            orderBy: { checkedInAt: 'desc' },
        });
    }
}

export const visitLogModel = new VisitLogModel();
