import { prisma } from '../lib/prisma';
import { watchListModel } from '../models';
import { io } from '../sockets';
import { SOCKET_EVENTS } from '@swagat/shared';

export const securityService = {
    async checkWatchlist(fullName: string) {
        const hit = await watchListModel.findByName(fullName);
        if (hit) {
            // Alert ALL connected receptionists — they share a broadcast room
            io.to('receptionist:all').emit(SOCKET_EVENTS.SECURITY_WATCHLIST_HIT, { fullName, reason: hit.reason });
        }
        return !!hit;
    },

    async signNda(visitorId: string, signature: string, ipAddress: string) {
        return prisma.ndaSignature.create({
            data: { visitorId, signature, ipAddress, documentVersion: 'v1.0' }
        });
    },

    getWatchlist() {
        return watchListModel.findMany({ where: { isActive: true }, orderBy: { addedAt: 'desc' } });
    },
};
