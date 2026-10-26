import { Prisma, Notification } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { BaseModel } from '../lib/base.model.js';

/**--------- Notification ---------- */
class NotificationModel extends BaseModel<
    Notification,
    Prisma.NotificationCreateInput,
    Prisma.NotificationUpdateInput,
    Prisma.NotificationWhereUniqueInput,
    Prisma.NotificationWhereInput,
    Prisma.NotificationOrderByWithRelationInput
> {
    constructor() {
        super(prisma.notification);
    }

    listForUser(userId: string) {
        return this.db.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
    }
}

export const notificationModel = new NotificationModel();