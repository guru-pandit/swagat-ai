import { prisma } from '../lib/prisma';
import { visitLogModel, packageModel, appointmentModel } from '../models';

export const dashboardService = {
    async summary(date: string | undefined, timezoneOffset: number, actor: { userId: string; role: string }) {
        // Dashboard day boundaries come from the browser so shifts follow the office's local day.
        const match = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const today = match
            ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + timezoneOffset * 60_000)
            : new Date();
        if (!match) today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const isReception = ['ADMIN', 'RECEPTIONIST'].includes(actor.role);
        const visitScope = isReception ? {} : { visitor: { hostId: actor.userId } };

        const [
            visitorsToday, activeVisitors,
            pendingPackages, upcomingAppointments,
        ] = await Promise.all([
            visitLogModel.count({ checkedInAt: { gte: today, lt: tomorrow }, ...visitScope }),
            visitLogModel.count({ status: 'CHECKED_IN', ...visitScope }),
            packageModel.count({ status: 'PENDING', ...(isReception ? {} : { recipientId: actor.userId }) }),
            appointmentModel.count({
                startsAt: { gte: new Date() },
                ...(isReception ? {} : { hostId: actor.userId }),
            })
        ]);

        // Load related visitor details directly because BaseModel.findMany has no include option.
        const recentVisits = await prisma.visitLog.findMany({
            where: { checkedInAt: { gte: today, lt: tomorrow }, ...visitScope },
            include: { visitor: { include: { host: true } } },
            orderBy: { checkedInAt: 'desc' },
            take: 10,
        });

        return {
            visitorsToday,
            activeVisitors,
            pendingPackages,
            upcomingAppointments,
            recentVisits
        }
    }
}
