"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const notifications_service_1 = require("./notifications.service");
exports.usersService = {
    async getMe(userId) {
        const user = await database_1.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true, email: true, username: true, displayName: true, bio: true,
                avatarUrl: true, bannerUrl: true, role: true, isVerified: true, createdAt: true,
                _count: { select: { followers: true, following: true, posts: true } },
            },
        });
        return {
            ...user,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            postsCount: user._count.posts,
        };
    },
    async updateMe(userId, data) {
        return database_1.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, bannerUrl: true },
        });
    },
    async deactivateMe(userId) {
        await database_1.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
        await database_1.prisma.refreshToken.deleteMany({ where: { userId } });
    },
    async getPublicProfile(userId, viewerId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId, isActive: true },
            select: {
                id: true, username: true, displayName: true, bio: true,
                avatarUrl: true, bannerUrl: true, isVerified: true, role: true, createdAt: true,
                _count: { select: { followers: true, following: true, posts: true } },
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
        await notifications_service_1.notificationsService.create({
            recipientId: followingId,
            type: 'NEW_FOLLOWER',
            actorId: followerId,
            entityId: followerId,
            entityType: 'User',
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
            where: { authorId: userId },
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(posts, limit);
    },
    async updatePushToken(userId, expoPushToken) {
        await database_1.prisma.user.update({ where: { id: userId }, data: { expoPushToken } });
    },
};
//# sourceMappingURL=users.service.js.map