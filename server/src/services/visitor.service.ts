import { userModel, visitLogModel } from '../models';
import { randomInt } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { io } from '../sockets';
import { SOCKET_EVENTS } from '@swagat/shared';
import { MESSAGES, HTTP_STATUS_CODE } from '../constants';
import { prisma } from '../lib/prisma';
import { VisitorStatus } from '@swagat/shared';
import { securityService } from './security.service';

interface CheckInData {
    fullName: string;
    email: string;
    phone?: string;
    company: string;
    photoUrl?: string;
    hostId: string;
    checkedInById?: string;
    notes?: string;
}

export const visitorService = {
    async checkIn(data: CheckInData) {
        if (typeof data.fullName !== 'string' || !data.fullName.trim() || data.fullName.trim().length > 120 || typeof data.hostId !== 'string' || !data.hostId.trim()) {
            throw new AppError('Enter a visitor name up to 120 characters and select a host.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
            throw new AppError('Enter a valid visitor email address.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        if ((data.notes?.length ?? 0) > 500) throw new AppError('Visit purpose must be 500 characters or fewer.', HTTP_STATUS_CODE.BAD_REQUEST);

        // 1. Verify host exists
        const host = await userModel.findById(data.hostId);
        if (!host || !host.isActive) throw new AppError(
            MESSAGES.HOST_NOT_FOUND,
            HTTP_STATUS_CODE.NOT_FOUND
        );

        // Check the security list before writing so an alert lookup failure cannot create a duplicate on retry.
        const watchListHit = await securityService.checkWatchlist(data.fullName);

        // 2. Create visitor + visit log in one transaction
        const result = await prisma.$transaction(async (tx) => {
            const visitor = await tx.visitor.create({
                data: {
                    fullName: data.fullName.trim(),
                    email: data.email?.trim() || null,
                    phone: data.phone?.trim() || null,
                    company: data.company?.trim() || null,
                    photoUrl: data.photoUrl || null,
                    hostId: data.hostId,
                    watchListHit,
                },
            });
            const visit = await tx.visitLog.create({
                data: {
                    visitorId: visitor.id,
                    status: VisitorStatus.CHECKED_IN,
                    checkedInAt: new Date(),
                    checkedInById: data.checkedInById,
                    notes: data.notes?.trim() || null,
                    badgeCode: randomInt(100000, 1000000).toString(),
                }
            });
            return { visitor, visit };
        });

        // 3. Notify the most in real time via socket
        io.to(`user:${data.hostId}`).emit(
            SOCKET_EVENTS.VISITOR_ARRIVED,
            { visitorName: data.fullName, visitId: result.visit.id }
        );

        return result;
    },

    async list(filters: { date?: string; timezoneOffset?: number; status?: string }, actor: { userId: string; role: string }) {
        if (filters.date && !/^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
            throw new AppError('Date must use YYYY-MM-DD format.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        // include: needed here - call the model's list() method which uses this.db directly
        const hostId = ['ADMIN', 'RECEPTIONIST'].includes(actor.role) ? undefined : actor.userId;
        return visitLogModel.list({ ...filters, hostId });
    },

    async checkOut(visitId: string, actor: { userId: string; role: string }) {
        // Find the host before updating so only that host's open dashboard receives the event.
        const visit = await prisma.visitLog.findUnique({
            where: { id: visitId },
            include: { visitor: true },
        });
        if (!visit) throw new AppError('Visit not found.', HTTP_STATUS_CODE.NOT_FOUND);
        if (!['ADMIN', 'RECEPTIONIST'].includes(actor.role) && visit.visitor.hostId !== actor.userId) {
            throw new AppError('You can only check out visitors assigned to you.', HTTP_STATUS_CODE.FORBIDDEN);
        }
        if (visit.status === VisitorStatus.CHECKED_OUT) {
            throw new AppError('This visitor has already checked out.', HTTP_STATUS_CODE.CONFLICT);
        }
        const updated = await visitLogModel.update(
            visitId,
            { status: VisitorStatus.CHECKED_OUT, checkedOutAt: new Date() }
        );
        io.to(`user:${visit.visitor.hostId}`).emit(SOCKET_EVENTS.VISITOR_LEFT, { visitId });
        return updated;
    }
}
