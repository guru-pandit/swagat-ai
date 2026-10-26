import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

import { env } from '../config/env';
import { logger } from '../lib/logger';
import { authService } from '../services/auth.service';

// Export so any service can emit: io.to('user:abc').emit('event', data)
export let io: Server;

export function initSockets(httpServer: HttpServer) {
    io = new Server(httpServer, {
        cors: { origin: env.CLIENT_URL, credentials: true },
    });

    // Authenticate the handshake before accepting connections so user rooms cannot be spoofed.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== 'string') return next(new Error('Authentication required'));
            socket.data.authUser = authService.verifyAccess(token);
            next();
        } catch {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        logger.debug({ socketId: socket.id }, 'Socket connected');

        // Derive the room from verified token claims instead of trusting a userId from the browser.
        socket.join(`user:${socket.data.authUser.userId}`);
        if (['ADMIN', 'RECEPTIONIST'].includes(socket.data.authUser.role)) socket.join('receptionist:all');

        socket.on('disconnect', () => {
            logger.debug({ socketId: socket.id }, 'Socket disconnected');
        });
    });

    return io;
}
