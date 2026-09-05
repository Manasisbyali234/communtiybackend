"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const bullmq_1 = require("../config/bullmq");
const client_1 = require("@prisma/client");
const email_service_1 = require("./email.service");
const notifications_service_1 = require("./notifications.service");
// Normalise any coverUrl variant to a relative proxy path so the frontend's
// toAbs() can prepend the correct host at runtime regardless of server IP.
function normalizeCoverUrl(coverUrl) {
    if (!coverUrl)
        return null;
    // Already a relative proxy path — ideal, leave it alone
    if (coverUrl.startsWith('/api/v1/media/proxy/'))
        return coverUrl;
    try {
        const url = new URL(coverUrl);
        // Absolute proxy URL with any host (e.g. old IP) — extract path and make relative
        if (url.pathname.startsWith('/api/v1/media/proxy/')) {
            const relativeProxyUrl = url.pathname + url.search;
            console.log('[normalizeCoverUrl] rewrote absolute proxy URL to relative:', relativeProxyUrl);
            return relativeProxyUrl;
        }
        // Legacy direct S3/R2 URL: extract the key and rewrite to relative proxy path.
        if (url.hostname.includes('amazonaws.com')) {
            const key = url.pathname.replace(/^\//, '');
            const relativeProxyUrl = `/api/v1/media/proxy/${encodeURIComponent(key)}`;
            console.log('[normalizeCoverUrl] rewrote legacy storage URL to relative proxy:', relativeProxyUrl);
            return relativeProxyUrl;
        }
    }
    catch { }
    return coverUrl;
}
exports.eventsService = {
    async list(params) {
        const { cursor, limit = 20, communityId, upcoming, search, userId, creatorId, includeUnapproved = false } = params;
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const events = await database_1.prisma.event.findMany({
            ...args,
            where: {
                ...(includeUnapproved ? {} : { status: client_1.EventStatus.APPROVED }),
                ...(creatorId
                    ? { OR: [{ creatorId }, { rsvps: { some: { userId: creatorId, status: client_1.RsvpStatus.GOING } } }] }
                    : {}),
                ...(communityId ? { communityId } : {}),
                ...(upcoming ? { startsAt: { gt: new Date() } } : {}),
                ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { location: { contains: search, mode: 'insensitive' } }] } : {}),
            },
            include: {
                community: { select: { id: true, name: true, slug: true } },
                creator: { select: { id: true, displayName: true, username: true } },
                ...(userId ? { interests: { where: { userId }, select: { id: true } } } : {}),
                ...(userId ? { rsvps: { where: { userId }, select: { status: true } } } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
        const normalized = events.map((e) => ({
            ...e,
            coverUrl: normalizeCoverUrl(e.coverUrl),
            isInterested: userId ? (e.interests?.length > 0) : false,
            myRsvp: e.rsvps?.[0]?.status ?? null,
            userRsvpStatus: e.rsvps?.[0]?.status ?? null,
            likesCount: e.likesCount ?? 0,
            commentsCount: e.commentsCount ?? 0,
            sharesCount: e.sharesCount ?? 0,
            interestedCount: e.interestedCount ?? 0,
            rsvpCount: e.rsvpCount ?? 0,
            interests: undefined,
            rsvps: undefined,
        }));
        console.log('[eventsService.list] sample coverUrls:', normalized.slice(0, 3).map((e) => ({ id: e.id, coverUrl: e.coverUrl })));
        return (0, pagination_1.buildCursorPage)(normalized, limit);
    },
    async create(creatorId, data) {
        const event = await database_1.prisma.event.create({
            data: { creatorId, ...data, status: client_1.EventStatus.PENDING_APPROVAL },
            include: { community: { select: { id: true, name: true } } },
        });
        // Schedule a reminder 24h before the event (non-critical — fire-and-forget)
        const reminderDelay = data.startsAt.getTime() - Date.now() - 24 * 60 * 60 * 1000;
        if (reminderDelay > 0) {
            (0, bullmq_1.getQueue)(bullmq_1.QUEUE_NAMES.EVENT_REMINDER)
                .add('remind', { eventId: event.id }, { delay: reminderDelay })
                .catch((err) => console.error('[eventsService.create] Failed to schedule reminder:', err));
        }
        // Email admin about new event pending approval (non-critical — fire-and-forget)
        database_1.prisma.user
            .findFirst({ where: { role: 'ADMIN' }, select: { email: true } })
            .then((adminUser) => {
            if (adminUser) {
                return email_service_1.emailService.sendAdminAlert(adminUser.email, `New Event Pending Approval: "${data.title}"`, `A new event <strong>"${data.title}"</strong> has been submitted and is awaiting your approval.`);
            }
        })
            .catch((err) => console.error('[eventsService.create] Failed to send admin email:', err));
        return event;
    },
    async getById(eventId, userId) {
        const event = await database_1.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                community: { select: { id: true, name: true, slug: true } },
                rsvps: { where: { userId }, select: { status: true } },
                interests: { where: { userId }, select: { id: true } },
            },
        });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED && event.creatorId !== userId)
            throw ApiError_1.ApiError.notFound('Event not found');
        return {
            ...event,
            coverUrl: normalizeCoverUrl(event.coverUrl),
            myRsvp: event.rsvps[0]?.status ?? null,
            isInterested: event.interests.length > 0,
            interests: undefined,
        };
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
    async archive(eventId, creatorId) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.creatorId !== creatorId)
            throw ApiError_1.ApiError.forbidden('Only the event creator can archive it');
        return database_1.prisma.event.update({ where: { id: eventId }, data: { status: client_1.EventStatus.ARCHIVED } });
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
    async toggleLike(eventId, userId) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED)
            throw ApiError_1.ApiError.notFound('Event not found');
        const existing = await database_1.prisma.eventLike.findUnique({ where: { eventId_userId: { eventId, userId } } });
        if (existing) {
            await database_1.prisma.$transaction([
                database_1.prisma.eventLike.delete({ where: { eventId_userId: { eventId, userId } } }),
                database_1.prisma.event.update({ where: { id: eventId }, data: { likesCount: { decrement: 1 } } }),
            ]);
            const updated = await database_1.prisma.event.findUnique({ where: { id: eventId }, select: { likesCount: true } });
            return { liked: false, likesCount: updated?.likesCount ?? 0 };
        }
        const [, updatedEvent] = await database_1.prisma.$transaction([
            database_1.prisma.eventLike.create({ data: { eventId, userId } }),
            database_1.prisma.event.update({ where: { id: eventId }, data: { likesCount: { increment: 1 } } }),
        ]);
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, displayName: true, email: true, username: true, phone: true },
        });
        const likedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const userLabel = user?.displayName || user?.username || userId;
        notifications_service_1.notificationsService.create({
            recipientId: event.creatorId,
            type: 'EVENT_LIKE',
            actorId: userId,
            entityId: eventId,
            entityType: 'Event',
            body: `${userLabel} liked "${event.title}" at ${likedAt}.`,
        }).catch((err) => console.error('[toggleLike] notification error:', err));
        database_1.prisma.user
            .findUnique({ where: { id: event.creatorId }, select: { email: true } })
            .then((creator) => {
            if (!creator)
                return;
            const html = `
          <div style="font-family:Arial,sans-serif;max-width:520px">
            <h2 style="color:#16A34A">New Like on Your Event 👍</h2>
            <p>Someone liked your event <strong>${event.title}</strong>.</p>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:6px 0;color:#555"><strong>Name</strong></td><td>${user?.displayName ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Username</strong></td><td>${user?.username ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Email</strong></td><td>${user?.email ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Phone</strong></td><td>${user?.phone ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Event</strong></td><td>${event.title}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Liked At</strong></td><td>${likedAt}</td></tr>
            </table>
          </div>`;
            return email_service_1.emailService.send({ to: creator.email, subject: `New Like: "${event.title}"`, html });
        })
            .catch((err) => console.error('[toggleLike] email error:', err));
        return { liked: true, likesCount: updatedEvent.likesCount };
    },
    async getComments(eventId, cursor, limit = 20) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const comments = await database_1.prisma.eventComment.findMany({
            ...args,
            where: { eventId },
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' },
        });
        return (0, pagination_1.buildCursorPage)(comments, limit);
    },
    async addComment(eventId, authorId, content) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED)
            throw ApiError_1.ApiError.notFound('Event not found');
        const [comment] = await database_1.prisma.$transaction([
            database_1.prisma.eventComment.create({
                data: { eventId, authorId, content },
                include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            }),
            database_1.prisma.event.update({ where: { id: eventId }, data: { commentsCount: { increment: 1 } } }),
        ]);
        const user = await database_1.prisma.user.findUnique({
            where: { id: authorId },
            select: { id: true, displayName: true, email: true, username: true, phone: true },
        });
        const commentedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const userLabel = user?.displayName || user?.username || authorId;
        if (event.creatorId !== authorId) {
            notifications_service_1.notificationsService.create({
                recipientId: event.creatorId,
                type: 'EVENT_COMMENT',
                actorId: authorId,
                entityId: eventId,
                entityType: 'Event',
                body: `${userLabel} commented on "${event.title}": "${content.slice(0, 80)}${content.length > 80 ? '…' : ''}"`,
            }).catch((err) => console.error('[addComment] notification error:', err));
            database_1.prisma.user
                .findUnique({ where: { id: event.creatorId }, select: { email: true } })
                .then((creator) => {
                if (!creator)
                    return;
                const html = `
            <div style="font-family:Arial,sans-serif;max-width:520px">
              <h2 style="color:#16A34A">New Comment on Your Event 💬</h2>
              <p>Someone commented on <strong>${event.title}</strong>.</p>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px 0;color:#555"><strong>Name</strong></td><td>${user?.displayName ?? 'N/A'}</td></tr>
                <tr><td style="padding:6px 0;color:#555"><strong>Username</strong></td><td>${user?.username ?? 'N/A'}</td></tr>
                <tr><td style="padding:6px 0;color:#555"><strong>Email</strong></td><td>${user?.email ?? 'N/A'}</td></tr>
                <tr><td style="padding:6px 0;color:#555"><strong>Phone</strong></td><td>${user?.phone ?? 'N/A'}</td></tr>
                <tr><td style="padding:6px 0;color:#555"><strong>Event</strong></td><td>${event.title}</td></tr>
                <tr><td style="padding:6px 0;color:#555"><strong>Comment</strong></td><td>${content}</td></tr>
                <tr><td style="padding:6px 0;color:#555"><strong>Posted At</strong></td><td>${commentedAt}</td></tr>
              </table>
            </div>`;
                return email_service_1.emailService.send({ to: creator.email, subject: `New Comment: "${event.title}"`, html });
            })
                .catch((err) => console.error('[addComment] email error:', err));
        }
        return comment;
    },
    async updateComment(commentId, userId, content) {
        const comment = await database_1.prisma.eventComment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw ApiError_1.ApiError.notFound('Comment not found');
        if (comment.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only edit your own comments');
        return database_1.prisma.eventComment.update({
            where: { id: commentId },
            data: { content },
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });
    },
    async deleteComment(commentId, eventId, userId, role) {
        const comment = await database_1.prisma.eventComment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw ApiError_1.ApiError.notFound('Comment not found');
        if (comment.authorId !== userId && role !== 'ADMIN' && role !== 'MODERATOR') {
            throw ApiError_1.ApiError.forbidden('Not authorized to delete this comment');
        }
        await database_1.prisma.$transaction([
            database_1.prisma.eventComment.delete({ where: { id: commentId } }),
            database_1.prisma.event.update({ where: { id: eventId }, data: { commentsCount: { decrement: 1 } } }),
        ]);
    },
    async shareEvent(eventId, userId) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED)
            throw ApiError_1.ApiError.notFound('Event not found');
        const updatedEvent = await database_1.prisma.event.update({
            where: { id: eventId },
            data: { sharesCount: { increment: 1 } },
            select: { sharesCount: true },
        });
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, displayName: true, email: true, username: true, phone: true },
        });
        const sharedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const userLabel = user?.displayName || user?.username || userId;
        notifications_service_1.notificationsService.create({
            recipientId: event.creatorId,
            type: 'EVENT_SHARE',
            actorId: userId,
            entityId: eventId,
            entityType: 'Event',
            body: `${userLabel} shared "${event.title}" at ${sharedAt}.`,
        }).catch((err) => console.error('[shareEvent] notification error:', err));
        database_1.prisma.user
            .findUnique({ where: { id: event.creatorId }, select: { email: true } })
            .then((creator) => {
            if (!creator)
                return;
            const html = `
          <div style="font-family:Arial,sans-serif;max-width:520px">
            <h2 style="color:#16A34A">Your Event Was Shared ↗</h2>
            <p>Someone shared your event <strong>${event.title}</strong>.</p>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:6px 0;color:#555"><strong>Name</strong></td><td>${user?.displayName ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Username</strong></td><td>${user?.username ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Email</strong></td><td>${user?.email ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Phone</strong></td><td>${user?.phone ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Event</strong></td><td>${event.title}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Shared At</strong></td><td>${sharedAt}</td></tr>
            </table>
          </div>`;
            return email_service_1.emailService.send({ to: creator.email, subject: `Event Shared: "${event.title}"`, html });
        })
            .catch((err) => console.error('[shareEvent] email error:', err));
        return { sharesCount: updatedEvent.sharesCount };
    },
    async toggleInterest(eventId, userId) {
        const event = await database_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw ApiError_1.ApiError.notFound('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED)
            throw ApiError_1.ApiError.notFound('Event not found');
        const existing = await database_1.prisma.eventInterest.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });
        if (existing) {
            // Remove interest
            await database_1.prisma.$transaction([
                database_1.prisma.eventInterest.delete({ where: { eventId_userId: { eventId, userId } } }),
                database_1.prisma.event.update({ where: { id: eventId }, data: { interestedCount: { decrement: 1 } } }),
            ]);
            const updated = await database_1.prisma.event.findUnique({ where: { id: eventId }, select: { interestedCount: true } });
            return { interested: false, interestedCount: updated?.interestedCount ?? 0 };
        }
        // Add interest
        const [, updatedEvent] = await database_1.prisma.$transaction([
            database_1.prisma.eventInterest.create({ data: { eventId, userId } }),
            database_1.prisma.event.update({ where: { id: eventId }, data: { interestedCount: { increment: 1 } } }),
        ]);
        // Fetch user details for notification
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, displayName: true, email: true, username: true, phone: true },
        });
        const markedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const userLabel = user?.displayName || user?.username || userId;
        const notifBody = `${userLabel} is interested in "${event.title}" (${markedAt}).
User ID: ${userId}
Email: ${user?.email ?? 'N/A'}`;
        // In-app notification to event creator
        notifications_service_1.notificationsService.create({
            recipientId: event.creatorId,
            type: 'EVENT_INTERESTED',
            actorId: userId,
            entityId: eventId,
            entityType: 'Event',
            body: notifBody,
        }).catch((err) => console.error('[toggleInterest] notification error:', err));
        // Email notification to event creator
        database_1.prisma.user
            .findUnique({ where: { id: event.creatorId }, select: { email: true } })
            .then((creator) => {
            if (!creator)
                return;
            const html = `
          <div style="font-family:Arial,sans-serif;max-width:520px">
            <h2 style="color:#16A34A">New Interest in Your Event 🎉</h2>
            <p>Someone marked interest in <strong>${event.title}</strong>.</p>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:6px 0;color:#555"><strong>Full Name</strong></td><td>${user?.displayName ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Username</strong></td><td>${user?.username ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Email</strong></td><td>${user?.email ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Phone</strong></td><td>${user?.phone ?? 'N/A'}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>User ID</strong></td><td>${userId}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Event</strong></td><td>${event.title}</td></tr>
              <tr><td style="padding:6px 0;color:#555"><strong>Marked At</strong></td><td>${markedAt}</td></tr>
            </table>
          </div>`;
            return email_service_1.emailService.send({ to: creator.email, subject: `New Interest: "${event.title}"`, html });
        })
            .catch((err) => console.error('[toggleInterest] email error:', err));
        return { interested: true, interestedCount: updatedEvent.interestedCount };
    },
};
//# sourceMappingURL=events.service.js.map