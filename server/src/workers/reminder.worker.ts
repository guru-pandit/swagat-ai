import { Queue, Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import { notificationService } from '../services/notification.service';
import { env } from '../config/env';

const redisUrl = new URL(env.REDIS_URL);
const connection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || (redisUrl.protocol === 'rediss:' ? 6380 : 6379)),
    ...(redisUrl.username ? { username: decodeURIComponent(redisUrl.username) } : {}),
    ...(redisUrl.password ? { password: decodeURIComponent(redisUrl.password) } : {}),
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
};

// Queue — add jobs to this from anywhere in the server
export const reminderQueue = new Queue('reminders', { connection });

// Worker — picks up jobs and processes them
export const reminderWorker = new Worker('reminders', async (job) => {
    const appt = await prisma.appointment.findUnique({
        where: { id: job.data.appointmentId },
        include: { visitor: true, host: true },
    });
    if (!appt || appt.reminderSent) return;

    await notificationService.email(
        appt.host.email,
        `Reminder: ${appt.visitor.fullName} arrives in 30 min`,
        `<p>Your visitor <b>${appt.visitor.fullName}</b> arrives at ${appt.startsAt.toLocaleTimeString()}.</p>`,
    );
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true } });
}, { connection });

// Call this when creating an appointment to schedule its reminder
export async function scheduleReminder(appointmentId: string, startsAt: Date) {
    const delay = startsAt.getTime() - Date.now() - 30 * 60_000; // 30 min before
    if (delay > 0) await reminderQueue.add('remind', { appointmentId }, { delay });
}
