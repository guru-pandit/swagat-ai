import { appointmentModel } from '../models';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { MESSAGES, HTTP_STATUS_CODE } from '../constants';
import { scheduleReminder } from '../workers/reminder.worker';
import { randomInt } from 'crypto';
import { SOCKET_EVENTS } from '@swagat/shared';
import { io } from '../sockets';
import { securityService } from './security.service';
import { logger } from '../lib/logger';

interface CreateData {
    visitorName: string;
    visitorEmail?: string;
    purpose: string;
    startsAt: string;
    endsAt: string;
    roomId?: string;
    hostId?: string;
}

export const appointmentService = {
    async create(data: CreateData, actor: { userId: string; role: string }) {
        // Reception staff can schedule for any active employee; employees can schedule only for themselves.
        const hostId = ['ADMIN', 'RECEPTIONIST'].includes(actor.role) ? (data.hostId || actor.userId) : actor.userId;
        const start = new Date(data.startsAt);
        const end = new Date(data.endsAt);

        // Validate the time window before asking the database to create any records.
        if (!data.visitorName?.trim() || data.visitorName.trim().length > 120 || !data.purpose?.trim() || data.purpose.trim().length > 500 || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= new Date() || end <= start) {
            throw new AppError('Enter a visitor, purpose, and a valid start/end time.', HTTP_STATUS_CODE.BAD_REQUEST);
        }
        if (data.visitorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.visitorEmail.trim())) {
            throw new AppError('Enter a valid visitor email address.', HTTP_STATUS_CODE.BAD_REQUEST);
        }

        const host = await prisma.user.findFirst({ where: { id: hostId, isActive: true }, select: { id: true } });
        if (!host) throw new AppError('The selected host is unavailable.', HTTP_STATUS_CODE.NOT_FOUND);

        // Hosts cannot accept overlapping meetings, even when no room was selected.
        const hostClash = await appointmentModel.findConflict(hostId, start, end);
        if (hostClash) throw new AppError('This host already has an appointment during that time.', HTTP_STATUS_CODE.CONFLICT);

        if (data.roomId) {
            const clash = await appointmentModel.findRoomConflict(data.roomId, start, end);
            if (clash) throw new AppError(MESSAGES.APPOINTMENT_CLASHED, HTTP_STATUS_CODE.CONFLICT);
        }

        // Create the visitor and appointment together so a failed booking leaves no orphan visitor.
        const appointment = await prisma.$transaction(async tx => {
            const visitor = await tx.visitor.create({
                data: { fullName: data.visitorName.trim(), email: data.visitorEmail?.trim() || null, hostId },
            });
            return tx.appointment.create({
                data: {
                    title: data.purpose.trim(), startsAt: start, endsAt: end, hostId,
                    visitorId: visitor.id, roomId: data.roomId || null,
                },
                include: { visitor: true, room: true },
            });
        });

        // Schedule only after the database transaction succeeds, using its persisted appointment ID.
        try {
            await scheduleReminder(appointment.id, appointment.startsAt);
        } catch (error) {
            // A queue outage should be logged without making reception retry an already-saved booking.
            logger.error({ error, appointmentId: appointment.id }, 'Appointment saved but reminder scheduling failed');
        }
        io.to(`user:${hostId}`).emit(SOCKET_EVENTS.APPOINTMENT_BOOKED, {
            appointmentId: appointment.id,
            visitorName: appointment.visitor.fullName,
            startsAt: appointment.startsAt,
        });
        return appointment;
    },

    async checkIn(appointmentId: string, actor: { userId: string; role: string }) {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { visitor: true, host: true },
        });
        if (!appointment) throw new AppError('Appointment not found.', HTTP_STATUS_CODE.NOT_FOUND);
        if (!['ADMIN', 'RECEPTIONIST'].includes(actor.role) && appointment.hostId !== actor.userId) {
            throw new AppError('You can only check in visitors for your own appointments.', HTTP_STATUS_CODE.FORBIDDEN);
        }

        const now = new Date();
        const earlyArrivalWindow = new Date(appointment.startsAt.getTime() - 60 * 60 * 1000);
        if (now < earlyArrivalWindow || now > appointment.endsAt) {
            throw new AppError('This visitor is outside the appointment check-in window.', HTTP_STATUS_CODE.CONFLICT);
        }
        const existingVisit = await prisma.visitLog.findFirst({
            where: { visitorId: appointment.visitorId, status: 'CHECKED_IN' },
        });
        if (existingVisit) throw new AppError('This visitor is already checked in.', HTTP_STATUS_CODE.CONFLICT);

        // Recheck the security list and retain the appointment purpose on the created visit record.
        const watchListHit = await securityService.checkWatchlist(appointment.visitor.fullName);
        if (watchListHit && !appointment.visitor.watchListHit) {
            await prisma.visitor.update({ where: { id: appointment.visitorId }, data: { watchListHit: true } });
        }
        const visit = await prisma.visitLog.create({
            data: {
                visitorId: appointment.visitorId,
                status: 'CHECKED_IN',
                checkedInAt: now,
                checkedInById: actor.userId,
                notes: appointment.title,
                badgeCode: randomInt(100000, 1000000).toString(),
            },
            include: { visitor: { include: { host: true } } },
        });
        io.to(`user:${appointment.hostId}`).emit(SOCKET_EVENTS.VISITOR_ARRIVED, {
            visitorName: appointment.visitor.fullName,
            visitId: visit.id,
        });
        return visit;
    },

    listForHost(actor: { userId: string; role: string }) {
        // Reception roles need the full schedule; an employee sees only visits they host.
        const hostId = ['ADMIN', 'RECEPTIONIST'].includes(actor.role) ? undefined : actor.userId;
        return appointmentModel.listForHost(hostId);
    },
};
