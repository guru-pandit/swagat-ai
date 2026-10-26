import './config/env';
import { env } from './config/env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import passport from 'passport';
import { configurePassport } from './config/passport';

import { HTTP_STATUS } from './constants/http';
import { logger } from './lib/logger';
import { initSockets } from './sockets';
import { connectRedis } from './lib/redis';
import { errorHandler } from './middleware/errorHandler';
import { reminderWorker } from './workers/reminder.worker';

import { authRouter } from './routes/auth.routes';
import { visitorRouter } from './routes/visitor.routes';
import { appointmentRouter } from './routes/appointment.routes';
import { packageRouter } from './routes/package.routes';
import { notificationRouter } from './routes/notification.routes';
import { aiRouter } from './routes/ai.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { securityRouter } from './routes/security.routes';
import { queueRouter } from './routes/queue.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { userRouter } from './routes/user.routes';

const app = express();
const http = createServer(app);

app.use(helmet());
configurePassport();
app.use(passport.initialize());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Routes will added here later
app.get('/api/health', (_req, res) => {
    return res.json({ status: HTTP_STATUS.OK, app: 'Swagat AI' });
});

app.use('/api/auth', authRouter);
app.use('/api/visitors', visitorRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/packages', packageRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/security', securityRouter);
app.use('/api/queue', queueRouter);
// Analytics is imported by the admin dashboard and must be registered before the error handler.
app.use('/api/analytics', analyticsRouter);
app.use('/api/users', userRouter);

app.use(errorHandler); // <- must be LAST, after all routes

async function main() {
    await connectRedis(); // connect to Redis first

    await reminderWorker.waitUntilReady();
    logger.info('Reminder worker ready');

    initSockets(http); // then start socket.io

    http.listen(env.PORT, () => {
        logger.info({ port: env.PORT }, 'Swagat AI server running');
    });
}

main().catch((err) => {
    logger.fatal({ err }, 'Server failed to start');
    process.exit(1);
});
