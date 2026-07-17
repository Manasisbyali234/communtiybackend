"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEventReminderWorker = startEventReminderWorker;
const bullmq_1 = require("../config/bullmq");
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
const notifications_service_1 = require("../services/notifications.service");
const index_1 = require("../sockets/index");
function startEventReminderWorker() {
    const worker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.EVENT_REMINDER, async (job) => {
        const { eventId } = job.data;
        logger_1.logger.info({ jobName: job.name, eventId }, 'Processing event reminder job');
        const event = await database_1.prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true, startsAt: true },
        });
        if (!event)
            return;
        // Only remind if it's actually coming up (hasn't been cancelled/deleted/rescheduled past the window)
        if (event.startsAt.getTime() - Date.now() > 48 * 60 * 60 * 1000)
            return;
        // Get attendees
        const attendees = await database_1.prisma.eventRsvp.findMany({
            where: { eventId, status: 'GOING' },
            select: { userId: true },
        });
        const io = (0, index_1.getIO)();
        // Dispatch notifications & push jobs
        const pushQueue = (0, bullmq_1.getQueue)(bullmq_1.QUEUE_NAMES.PUSH);
        for (const rsvp of attendees) {
            // 1. In-app notification
            await notifications_service_1.notificationsService.create({
                recipientId: rsvp.userId,
                type: 'EVENT_REMINDER',
                entityId: eventId,
                entityType: 'Event',
                body: `Reminder: ${event.title} is starting soon!`,
            });
            // 2. Real-time socket event
            io.to(`user:${rsvp.userId}`).emit('notification:new', {
                type: 'EVENT_REMINDER',
                body: `Reminder: ${event.title} is starting soon!`,
            });
            // 3. Queue push notification
            const user = await database_1.prisma.user.findUnique({
                where: { id: rsvp.userId },
                select: { deviceTokens: { select: { token: true } } }
            });
            if (user?.deviceTokens?.length) {
                await pushQueue.add('send', {
                    tokens: user.deviceTokens.map(dt => dt.token),
                    title: 'Upcoming Event',
                    body: `${event.title} is starting soon!`,
                    data: { eventId },
                });
            }
        }
        logger_1.logger.info({ eventId, remindedCount: attendees.length }, 'Event reminders sent');
    });
    return worker;
}
//# sourceMappingURL=eventReminderWorker.js.map