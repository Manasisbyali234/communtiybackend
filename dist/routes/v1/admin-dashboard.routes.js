"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const database_1 = require("../../config/database");
const notifications_service_1 = require("../../services/notifications.service");
const router = (0, express_1.Router)();
router.use(adminAuth_1.adminAuth);
// ── Pending Counts (bell icon) ────────────────────────────────────────────────
router.get('/pending-counts', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [pendingCommunities, pendingEvents] = await Promise.all([
        database_1.prisma.community.count({ where: { status: 'PENDING' } }),
        database_1.prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { pendingCommunities, pendingEvents, total: pendingCommunities + pendingEvents }));
}));
const paginate = (query) => ({
    skip: parseInt(query.skip ?? '0'),
    take: Math.min(parseInt(query.take ?? '20'), 100),
});
const searchWhere = (q, fields = ['email', 'username', 'displayName']) => q ? { OR: fields.map((f) => ({ [f]: { contains: q, mode: 'insensitive' } })) } : {};
// ── Dashboard Overview ────────────────────────────────────────────────────────
router.get('/dashboard', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalUsers, totalProfiles, totalCommunities, totalCommunityPosts, totalEvents, totalFeeds, totalStories, totalComments, totalLikes, totalReports, totalNotifications, activeToday,] = await Promise.all([
        database_1.prisma.user.count({ where: { deletedAt: null } }),
        database_1.prisma.user.count({ where: { deletedAt: null, avatarUrl: { not: null } } }),
        database_1.prisma.community.count(),
        database_1.prisma.post.count({ where: { deletedAt: null, communityId: { not: null } } }),
        database_1.prisma.event.count(),
        database_1.prisma.post.count({ where: { deletedAt: null, communityId: null } }),
        database_1.prisma.story.count(),
        database_1.prisma.comment.count({ where: { deletedAt: null } }),
        database_1.prisma.like.count(),
        database_1.prisma.report.count(),
        database_1.prisma.notification.count(),
        database_1.prisma.user.count({ where: { deletedAt: null, updatedAt: { gte: today } } }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, {
        totalUsers, totalProfiles, totalCommunities, totalCommunityPosts,
        totalEvents, totalFeeds, totalStories, totalComments, totalLikes,
        totalReports, totalNotifications, activeToday,
    }));
}));
// ── Charts ────────────────────────────────────────────────────────────────────
router.get('/charts/dau', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await database_1.prisma.dailyStats.findMany({
        orderBy: { date: 'asc' }, take: 30,
        select: { date: true, activeUsers: true, newUsers: true },
    });
    res.json(new ApiResponse_1.ApiResponse(200, data));
}));
router.get('/charts/user-growth', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await database_1.prisma.$queryRaw `
    SELECT DATE_TRUNC('day',"createdAt") as date, COUNT(*) as count
    FROM "User" WHERE "createdAt" >= NOW()-INTERVAL '30 days' AND "deletedAt" IS NULL
    GROUP BY 1 ORDER BY 1`;
    res.json(new ApiResponse_1.ApiResponse(200, data.map(r => ({ date: r.date, count: Number(r.count) }))));
}));
router.get('/charts/community-activity', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await database_1.prisma.$queryRaw `
    SELECT DATE_TRUNC('day',"createdAt") as date, COUNT(*) as count
    FROM "Post" WHERE "createdAt" >= NOW()-INTERVAL '30 days' AND "deletedAt" IS NULL AND "communityId" IS NOT NULL
    GROUP BY 1 ORDER BY 1`;
    res.json(new ApiResponse_1.ApiResponse(200, data.map(r => ({ date: r.date, count: Number(r.count) }))));
}));
router.get('/charts/feed-activity', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await database_1.prisma.$queryRaw `
    SELECT DATE_TRUNC('day',"createdAt") as date, COUNT(*) as count
    FROM "Post" WHERE "createdAt" >= NOW()-INTERVAL '30 days' AND "deletedAt" IS NULL AND "communityId" IS NULL
    GROUP BY 1 ORDER BY 1`;
    res.json(new ApiResponse_1.ApiResponse(200, data.map(r => ({ date: r.date, count: Number(r.count) }))));
}));
router.get('/charts/event-trend', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await database_1.prisma.$queryRaw `
    SELECT DATE_TRUNC('day',"createdAt") as date, COUNT(*) as count
    FROM "Event" WHERE "createdAt" >= NOW()-INTERVAL '30 days'
    GROUP BY 1 ORDER BY 1`;
    res.json(new ApiResponse_1.ApiResponse(200, data.map(r => ({ date: r.date, count: Number(r.count) }))));
}));
// ── Recent Activity ───────────────────────────────────────────────────────────
router.get('/recent-activity', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [users, posts, communities, events, stories] = await Promise.all([
        database_1.prisma.user.findMany({
            where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, displayName: true, email: true, avatarUrl: true, createdAt: true },
        }),
        database_1.prisma.post.findMany({
            where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, content: true, createdAt: true, communityId: true,
                author: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
        }),
        database_1.prisma.community.findMany({
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, name: true, createdAt: true,
                members: { where: { role: 'ADMIN' }, take: 1,
                    select: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true } } } } },
        }),
        database_1.prisma.event.findMany({
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, title: true, createdAt: true, creatorId: true,
                creator: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
                community: { select: { name: true } } },
        }),
        database_1.prisma.story.findMany({
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, mediaType: true, createdAt: true,
                author: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
        }),
    ]);
    const activity = [
        ...users.map(u => ({ type: 'USER_REGISTERED', user: u, action: 'registered', date: u.createdAt })),
        ...posts.map(p => ({ type: p.communityId ? 'COMMUNITY_POST' : 'FEED_POSTED', user: p.author, action: p.communityId ? 'created a community post' : 'posted a feed', date: p.createdAt })),
        ...communities.map(c => ({ type: 'COMMUNITY_CREATED', user: c.members[0]?.user ?? null, action: `created community "${c.name}"`, date: c.createdAt })),
        ...events.map(e => ({ type: 'EVENT_CREATED', user: e.creator ?? null, action: `created event "${e.title}"`, date: e.createdAt })),
        ...stories.map(s => ({ type: 'STORY_UPLOADED', user: s.author, action: 'uploaded a story', date: s.createdAt })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
    res.json(new ApiResponse_1.ApiResponse(200, activity));
}));
// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q, status, isVerified, startDate, endDate } = req.query;
    const where = {
        deletedAt: null,
        role: { not: 'ADMIN' },
        ...searchWhere(q),
        ...(status === 'active' ? { isActive: true, isBanned: false } : {}),
        ...(status === 'blocked' ? { isBanned: true } : {}),
        ...(isVerified === 'true' ? { isVerified: true } : {}),
        ...(startDate ? { createdAt: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { createdAt: { ...(startDate ? { gte: new Date(startDate) } : {}), lte: new Date(endDate) } } : {}),
    };
    const [users, total] = await Promise.all([
        database_1.prisma.user.findMany({
            skip, take, where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, email: true, username: true, displayName: true, avatarUrl: true,
                role: true, isActive: true, isVerified: true, isBanned: true, banReason: true,
                village: true, occupation: true, createdAt: true, updatedAt: true,
                _count: { select: { posts: true, communityMembers: true, eventRsvps: true } },
            },
        }),
        database_1.prisma.user.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { users, total, skip, take }));
}));
router.put('/users/:id/ban', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reason } = req.body;
    const user = await database_1.prisma.user.update({
        where: { id: req.params['id'] },
        data: { isBanned: true, banReason: reason, isActive: false },
        select: { id: true, username: true, isBanned: true },
    });
    res.json(new ApiResponse_1.ApiResponse(200, user, 'User banned'));
}));
router.put('/users/:id/unban', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await database_1.prisma.user.update({
        where: { id: req.params['id'] },
        data: { isBanned: false, banReason: null, isActive: true },
        select: { id: true, username: true, isBanned: true },
    });
    res.json(new ApiResponse_1.ApiResponse(200, user, 'User unbanned'));
}));
router.delete('/users/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.user.update({ where: { id: req.params['id'] }, data: { deletedAt: new Date() } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'User deleted'));
}));
// ── Profiles ──────────────────────────────────────────────────────────────────
router.get('/profiles', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q } = req.query;
    const where = { deletedAt: null, ...searchWhere(q) };
    const [profiles, total] = await Promise.all([
        database_1.prisma.user.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            select: {
                id: true, displayName: true, username: true, bio: true, avatarUrl: true, bannerUrl: true,
                coverImage: true, createdAt: true, updatedAt: true,
                _count: { select: { followers: true, following: true, posts: true } },
            },
        }),
        database_1.prisma.user.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { profiles, total, skip, take }));
}));
// ── Communities ───────────────────────────────────────────────────────────────
router.get('/communities/pending', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const communities = await database_1.prisma.community.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true, name: true, slug: true, description: true, avatarUrl: true, bannerUrl: true,
            category: true, isPrivate: true, createdAt: true, status: true,
            members: { where: { role: 'ADMIN' }, take: 1,
                select: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } } },
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, { communities, total: communities.length }));
}));
router.put('/communities/:id/approve', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const community = await database_1.prisma.community.update({
        where: { id: req.params['id'] },
        data: { status: 'APPROVED', memberCount: 1 },
        select: { id: true, name: true, status: true },
    });
    const admin = await database_1.prisma.communityMember.findFirst({
        where: { communityId: req.params['id'], role: 'ADMIN' },
        select: { userId: true },
    });
    if (admin) {
        await notifications_service_1.notificationsService.create({
            recipientId: admin.userId,
            type: 'COMMUNITY_APPROVED',
            entityId: community.id,
            entityType: 'Community',
            body: `Your community "${community.name}" has been approved!`,
        });
    }
    res.json(new ApiResponse_1.ApiResponse(200, community, 'Community approved'));
}));
router.put('/communities/:id/reject', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reason } = req.body;
    const community = await database_1.prisma.community.update({
        where: { id: req.params['id'] },
        data: { status: 'REJECTED' },
        select: { id: true, name: true, status: true },
    });
    const admin = await database_1.prisma.communityMember.findFirst({
        where: { communityId: req.params['id'], role: 'ADMIN' },
        select: { userId: true },
    });
    if (admin) {
        await notifications_service_1.notificationsService.create({
            recipientId: admin.userId,
            type: 'COMMUNITY_REJECTED',
            entityId: community.id,
            entityType: 'Community',
            body: `Your community "${community.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
        });
    }
    res.json(new ApiResponse_1.ApiResponse(200, community, 'Community rejected'));
}));
router.get('/communities', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q, status } = req.query;
    const statusFilter = status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? status : undefined;
    const where = {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [communities, total] = await Promise.all([
        database_1.prisma.community.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, slug: true, description: true, avatarUrl: true, bannerUrl: true,
                category: true, isPrivate: true, memberCount: true, status: true, createdAt: true, updatedAt: true,
                _count: { select: { posts: true, members: true } },
                members: { where: { role: 'ADMIN' }, take: 1,
                    select: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } } },
            },
        }),
        database_1.prisma.community.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { communities, total, skip, take }));
}));
router.get('/communities/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const community = await database_1.prisma.community.findUnique({
        where: { id: req.params['id'] },
        include: {
            members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } } },
            posts: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20,
                include: { author: { select: { id: true, displayName: true, avatarUrl: true } } } },
            events: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
    });
    if (!community)
        throw ApiError_1.ApiError.notFound('Community not found');
    res.json(new ApiResponse_1.ApiResponse(200, community));
}));
router.delete('/communities/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.community.delete({ where: { id: req.params['id'] } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Community deleted'));
}));
// ── Community Posts ───────────────────────────────────────────────────────────
router.put('/community-posts/:id/approve', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const post = await database_1.prisma.post.update({
        where: { id: req.params['id'] },
        data: { status: 'APPROVED' },
        select: { id: true, status: true, authorId: true, content: true },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: post.authorId,
        type: 'POST_APPROVED',
        entityId: post.id,
        entityType: 'Post',
        body: `Your post has been approved and is now visible to the community.`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, post, 'Post approved'));
}));
router.put('/community-posts/:id/reject', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reason } = req.body;
    const post = await database_1.prisma.post.update({
        where: { id: req.params['id'] },
        data: { status: 'REJECTED' },
        select: { id: true, status: true, authorId: true, content: true },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: post.authorId,
        type: 'POST_REJECTED',
        entityId: post.id,
        entityType: 'Post',
        body: `Your post was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, post, 'Post rejected'));
}));
router.get('/community-posts', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q, communityId, status } = req.query;
    const statusMap = { PENDING: 'PENDING_APPROVAL', APPROVED: 'APPROVED', REJECTED: 'REJECTED' };
    const mappedStatus = status && statusMap[status] ? statusMap[status] : undefined;
    const where = {
        deletedAt: null, communityId: { not: null },
        ...(communityId ? { communityId } : {}),
        ...(mappedStatus ? { status: mappedStatus } : {}),
        ...(q ? { content: { contains: q, mode: 'insensitive' } } : {}),
    };
    const [posts, total] = await Promise.all([
        database_1.prisma.post.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            select: {
                id: true, content: true, mediaUrls: true, mediaType: true, likesCount: true,
                commentsCount: true, sharesCount: true, status: true, createdAt: true, updatedAt: true, deletedAt: true,
                author: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
                community: { select: { id: true, name: true, avatarUrl: true } },
            },
        }),
        database_1.prisma.post.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { posts, total, skip, take }));
}));
router.delete('/community-posts/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.post.update({ where: { id: req.params['id'] }, data: { deletedAt: new Date() } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Post removed'));
}));
// ── Feeds ─────────────────────────────────────────────────────────────────────
router.get('/feeds', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q } = req.query;
    const where = {
        deletedAt: null, communityId: null,
        ...(q ? { content: { contains: q, mode: 'insensitive' } } : {}),
    };
    const [feeds, total] = await Promise.all([
        database_1.prisma.post.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            select: {
                id: true, content: true, mediaUrls: true, mediaType: true, videoUrl: true,
                likesCount: true, commentsCount: true, sharesCount: true, createdAt: true, updatedAt: true,
                author: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
            },
        }),
        database_1.prisma.post.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { feeds, total, skip, take }));
}));
router.delete('/feeds/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.post.update({ where: { id: req.params['id'] }, data: { deletedAt: new Date() } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Feed removed'));
}));
// ── Events ────────────────────────────────────────────────────────────────────
router.get('/events', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q, status } = req.query;
    const statusMap = { PENDING: 'PENDING_APPROVAL', APPROVED: 'APPROVED', REJECTED: 'REJECTED' };
    const mappedStatus = status && statusMap[status] ? statusMap[status] : undefined;
    const where = {
        ...(mappedStatus ? { status: mappedStatus } : {}),
        ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [events, total] = await Promise.all([
        database_1.prisma.event.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            select: {
                id: true, title: true, description: true, location: true, startsAt: true, endsAt: true,
                coverUrl: true, rsvpCount: true, status: true, createdAt: true, updatedAt: true,
                community: { select: { id: true, name: true } },
                creator: { select: { id: true, displayName: true, username: true } },
                _count: { select: { rsvps: true } },
            },
        }),
        database_1.prisma.event.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { events, total, skip, take }));
}));
router.put('/events/:id/approve', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const event = await database_1.prisma.event.update({
        where: { id: req.params['id'] },
        data: { status: 'APPROVED' },
        select: { id: true, title: true, status: true, creatorId: true },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: event.creatorId,
        type: 'EVENT_APPROVED',
        entityId: event.id,
        entityType: 'Event',
        body: `Your event "${event.title}" has been approved!`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, event, 'Event approved'));
}));
router.put('/events/:id/reject', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reason } = req.body;
    const event = await database_1.prisma.event.update({
        where: { id: req.params['id'] },
        data: { status: 'REJECTED' },
        select: { id: true, title: true, status: true, creatorId: true },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: event.creatorId,
        type: 'EVENT_REJECTED',
        entityId: event.id,
        entityType: 'Event',
        body: `Your event "${event.title}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, event, 'Event rejected'));
}));
router.delete('/events/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.event.delete({ where: { id: req.params['id'] } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Event deleted'));
}));
// ── Stories ───────────────────────────────────────────────────────────────────
router.get('/stories', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { q } = req.query;
    const where = q ? { author: { OR: [{ displayName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } } : {};
    const [stories, total] = await Promise.all([
        database_1.prisma.story.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            select: {
                id: true, mediaUrl: true, mediaType: true, viewCount: true, likesCount: true,
                expiresAt: true, createdAt: true,
                author: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
            },
        }),
        database_1.prisma.story.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { stories, total, skip, take }));
}));
router.delete('/stories/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.story.delete({ where: { id: req.params['id'] } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Story deleted'));
}));
// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { skip, take } = paginate(req.query);
    const { status, q } = req.query;
    const where = {
        ...(status ? { status: status } : {}),
        ...(q ? { OR: [{ details: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [reports, total] = await Promise.all([
        database_1.prisma.report.findMany({
            skip, take, where, orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
                reportedUser: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
                post: { select: { id: true, content: true, mediaUrls: true } },
            },
        }),
        database_1.prisma.report.count({ where }),
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, { reports, total, skip, take }));
}));
router.put('/reports/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, resolution } = req.body;
    const report = await database_1.prisma.report.update({
        where: { id: req.params['id'] },
        data: { status: status, reviewedAt: new Date(), ...(resolution ? { resolution } : {}) },
    });
    res.json(new ApiResponse_1.ApiResponse(200, report, 'Report updated'));
}));
exports.default = router;
//# sourceMappingURL=admin-dashboard.routes.js.map