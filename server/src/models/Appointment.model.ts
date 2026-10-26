import { Prisma, Appointment } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { BaseModel } from '../lib/base.model.js';

/**--------- Appointment ---------- */
class AppointmentModel extends BaseModel<
    Appointment,
    Prisma.AppointmentCreateInput,
    Prisma.AppointmentUpdateInput,
    Prisma.AppointmentWhereUniqueInput,
    Prisma.AppointmentWhereInput,
    Prisma.AppointmentOrderByWithRelationInput
> {
    constructor() {
        super(prisma.appointment);
    }

    /** Check for overlapping slot before booking */
    findConflict(hostId: string, startAt: Date, endsAt: Date) {
        return this.db.findFirst({
            where: {
                hostId,
                OR: [{
                    startsAt: { lt: endsAt },
                    endsAt: { gt: startAt },
                }]
            }
        }) as Promise<Appointment | null>;
    }

    /** Room double-booking guard - different from findConflict which checks */
    findRoomConflict(roomId: string, start: Date, end: Date) {
        return this.db.findFirst({
            where: {
                roomId,
                startsAt: { lt: end },
                endsAt: { gt: start },
            }
        }) as Promise<Appointment | null>;
    }

    listForHost(hostId?: string) {
        return this.db.findMany({
            where: hostId ? { hostId } : {},
            include: {
                visitor: { include: { visits: { where: { status: 'CHECKED_IN' }, select: { id: true } } } },
                host: true,
            },
            orderBy: { startsAt: "asc" },
        });
    }

}

export const appointmentModel = new AppointmentModel();
