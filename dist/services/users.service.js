"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const notifications_service_1 = require("./notifications.service");
const client_1 = require("@prisma/client");
exports.usersService = {
    async getMe(userId) {
        const user = await database_1.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true, email: true, username: true, displayName: true, bio: true,
                avatarUrl: true, bannerUrl: true, coverImage: true, village: true, occupation: true, languages: true, interests: true, role: true, isVerified: true, createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                        // Do not count rejected or pending community applications as memberships.
                        communityMembers: { where: { status: client_1.CommunityMemberStatus.ACTIVE } },
                        helpOffers: true,
                        eventRsvps: { where: { status: 'GOING' } },
                    },
                },
            },
        });
        return {
            ...user,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            postsCount: user._count.posts,
            communitiesCount: user._count.communityMembers,
            helpCount: user._count.helpOffers,
            attendedEventCount: user._count.eventRsvps,
        };
    },
    async updateMe(userId, data) {
        return database_1.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, bannerUrl: true, coverImage: true, village: true, occupation: true, languages: true, interests: true },
        });
    },
    async deactivateMe(userId, reason) {
        const deletedAt = new Date();
        await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt,
                deletionReason: reason ?? null,
                email: `deleted+${userId}@deleted.local`,
                username: `deleted_${userId}`,
                displayName: 'Deleted user',
                avatarUrl: null,
                bannerUrl: null,
                coverImage: null,
                bio: null,
            },
        });
        await database_1.prisma.refreshToken.deleteMany({ where: { userId } });
    },
    async getPublicProfile(userId, viewerId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId, isActive: true },
            select: {
                id: true, username: true, displayName: true, bio: true,
                avatarUrl: true, bannerUrl: true, coverImage: true, village: true, occupation: true,
                languages: true, interests: true, isVerified: true, role: true, createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                        // A help count represents concrete responses, not requests created.
                        helpOffers: true,
                        // The data model records attendance through a GOING RSVP.
                        eventRsvps: { where: { status: 'GOING' } },
                        communityMembers: { where: { status: client_1.CommunityMemberStatus.ACTIVE } },
                    },
                },
            },
        });
        if (!user)
            throw ApiError_1.ApiError.notFound('User not found');
        const isFollowing = viewerId !== userId
            ? !!(await database_1.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: userId } } }))
            : false;
        return {
            ...user,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            postsCount: user._count.posts,
            helpCount: user._count.helpOffers,
            attendedEventCount: user._count.eventRsvps,
            communitiesCount: user._count.communityMembers,
            isFollowing,
        };
    },
    async followUser(followerId, followingId) {
        if (followerId === followingId)
            throw ApiError_1.ApiError.badRequest('You cannot follow yourself');
        const target = await database_1.prisma.user.findUnique({ where: { id: followingId } });
        if (!target)
            throw ApiError_1.ApiError.notFound('User not found');
        await database_1.prisma.follow.upsert({
            where: { followerId_followingId: { followerId, followingId } },
            create: { followerId, followingId },
            update: {},
        });
        const follower = await database_1.prisma.user.findUnique({ where: { id: followerId }, select: { displayName: true } });
        await notifications_service_1.notificationsService.create({
            recipientId: followingId,
            type: 'FOLLOW',
            actorId: followerId,
            entityId: followerId,
            entityType: 'User',
            body: `${follower?.displayName ?? 'Someone'} started following you.`,
        });
    },
    async unfollowUser(followerId, followingId) {
        await database_1.prisma.follow.deleteMany({ where: { followerId, followingId } });
    },
    async getFollowers(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const follows = await database_1.prisma.follow.findMany({
            ...args,
            where: { followingId: userId },
            include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const items = follows.map((f) => f.follower);
        return (0, pagination_1.buildCursorPage)(items, limit);
    },
    async getFollowing(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const follows = await database_1.prisma.follow.findMany({
            ...args,
            where: { followerId: userId },
            include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const items = follows.map((f) => f.following);
        return (0, pagination_1.buildCursorPage)(items, limit);
    },
    async getUserPosts(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const posts = await database_1.prisma.post.findMany({
            ...args,
            // Posts are soft-deleted, so never return records the author has deleted.
            where: { authorId: userId, deletedAt: null },
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(posts, limit);
    },
    async getUserJoinedEvents(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const events = await database_1.prisma.event.findMany({
            ...args,
            where: {
                status: client_1.EventStatus.APPROVED,
                rsvps: { some: { userId, status: client_1.RsvpStatus.GOING } },
            },
            include: { community: { select: { id: true, name: true, slug: true } } },
            orderBy: { startsAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(events, limit);
    },
    async updatePushToken(userId, expoPushToken) {
        await database_1.prisma.deviceToken.upsert({
            where: { token: expoPushToken },
            create: { userId, token: expoPushToken, platform: 'android' },
            update: { userId },
        });
    },
};
//# sourceMappingURL=users.service.js.map