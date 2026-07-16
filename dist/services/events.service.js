"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const bullmq_1 = require("../config/bullmq");
exports.eventsService = {
    async list(params) {
        const { cursor, limit = 20, communityId, upcoming, search } = params;
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const events = await database_1.prisma.event.findMany({
            ...args,
            where: {
                ...(communityId ? { communityId } : {}),
                ...(upcoming ? { startsAt: { gt: new Date() } } : {}),
                ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { location: { contains: search, mode: 'insensitive' } }] } : {}),
            },
            include: { community: { select: { id: true, name: true, slug: true } } },
            orderBy: { startsAt: 'asc' },
        });
        return (0, pagination_1.buildCursorPage)(events, limit);
    },
    async create(creatorId, data) {
        const event = await database_1.prisma.event.create({
            data: { creatorId, ...data },
            include: { community: { select: { id: true, name: true } } },
        });
        // Schedule a reminder 24h before the event
        const reminderDelay = data.startsAt.getTime() - Date.now() - 24 * 60 * 60 * 1000;
        if (reminderDelay > 0) {
            const queue = (0, bullmq_1.getQueue)(bullmq_1.QUEUE_NAMES.EVENT_REMINDER);
            await queue.add('remind', { eventId: event.id }, { delay: reminderDelay });
        }
        return event;
    },
    async getById(eventId, userId) {
        const event = await database_1.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                community: { select: { id: true, name: true, slug: true } },
                rsvps: { where: { userId }, select: { status: true } },
            },
        });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        return { ...event, myRsvp: event.rsvps[0]?.status ?? null };
    },
    async update(eventId, creatorId, data) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.creatorId !== creatorId)
            throw ApiError_1.ApiError.forbidden('Only the event creator can update it');
        return database_1.prisma.event.update({ where: { id: eventId }, data });
    },
    async delete(eventId, creatorId) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.creatorId !== creatorId)
            throw ApiError_1.ApiError.forbidden('Only the event creator can delete it');
        await database_1.prisma.event.delete({ where: { id: eventId } });
    },
    async rsvp(eventId, userId, status) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        const existing = await database_1.prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
        const wasGoing = existing?.status === 'GOING';
        const isGoing = status === 'GOING';
        const rsvp = await database_1.prisma.eventRsvp.upsert({
            where: { eventId_userId: { eventId, userId } },
            create: { eventId, userId, status },
            update: { status },
        });
        // Adjust rsvpCount based on transition
        if (!wasGoing && isGoing) {
            await database_1.prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { increment: 1 } } });
        }
        else if (wasGoing && !isGoing) {
            await database_1.prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { decrement: 1 } } });
        }
        return rsvp;
    },
    async cancelRsvp(eventId, userId) {
        const rsvp = await database_1.prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
        if (!rsvp)
            return;
        await database_1.prisma.$transaction([
            database_1.prisma.eventRsvp.delete({ where: { eventId_userId: { eventId, userId } } }),
            ...(rsvp.status === 'GOING' ? [database_1.prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { decrement: 1 } } })] : []),
        ]);
    },
    async getAttendees(eventId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const rsvps = await database_1.prisma.eventRsvp.findMany({
            ...args,
            where: { eventId },
            include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' },
        });
        const items = rsvps.map((r) => ({ ...r.user, status: r.status }));
        return (0, pagination_1.buildCursorPage)(items, limit);
    },
};
//# sourceMappingURL=events.service.js.map