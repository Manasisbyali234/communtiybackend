"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storiesService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const bullmq_1 = require("../config/bullmq");
const ApiError_1 = require("../utils/ApiError");
const STORY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
exports.storiesService = {
    async getFeed(userId) {
        const follows = await database_1.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
        const followingIds = [...follows.map((f) => f.followingId), userId];
        const stories = await database_1.prisma.story.findMany({
            where: {
                authorId: { in: followingIds },
                expiresAt: { gt: new Date() },
            },
            include: {
                author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                views: { where: { viewerId: userId }, select: { viewerId: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Group by user
        const grouped = new Map();
        for (const story of stories) {
            const key = story.authorId;
            if (!grouped.has(key)) {
                grouped.set(key, { user: story.author, stories: [], hasUnseen: false });
            }
            const group = grouped.get(key);
            group.stories.push(story);
            if (story.views.length === 0)
                group.hasUnseen = true;
        }
        return Array.from(grouped.values());
    },
    async create(authorId, mediaUrl, mediaType) {
        const expiresAt = new Date(Date.now() + STORY_TTL_SECONDS * 1000);
        const story = await database_1.prisma.story.create({
            data: { authorId, mediaUrl, mediaType, expiresAt },
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });
        // Set Redis TTL for fast-path check
        await redis_1.redis.set(`story:${story.id}`, '1', 'EX', STORY_TTL_SECONDS);
        // Schedule BullMQ cleanup job
        const queue = (0, bullmq_1.getQueue)(bullmq_1.QUEUE_NAMES.STORY_EXPIRY);
        await queue.add('expire', { storyId: story.id }, { delay: STORY_TTL_SECONDS * 1000 });
        return story;
    },
    async delete(storyId, userId) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only delete your own stories');
        await database_1.prisma.story.delete({ where: { id: storyId } });
        await redis_1.redis.del(`story:${storyId}`);
    },
    async recordView(storyId, viewerId) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.expiresAt < new Date())
            throw ApiError_1.ApiError.notFound('Story has expired');
        await database_1.prisma.$transaction([
            database_1.prisma.storyView.upsert({
                where: { storyId_viewerId: { storyId, viewerId } },
                create: { storyId, viewerId },
                update: {},
            }),
            database_1.prisma.story.update({ where: { id: storyId }, data: { viewCount: { increment: 1 } } }),
        ]);
    },
    async getViewers(storyId, userId) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only view viewers of your own stories');
        return database_1.prisma.storyView.findMany({
            where: { storyId },
            include: { story: { select: { id: true } } },
            orderBy: { createdAt: 'desc' },
        });
    },
    // ── Story Likes ──────────────────────────────────────────────────────────────
    async likeStory(storyId, userId) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.expiresAt < new Date())
            throw ApiError_1.ApiError.notFound('Story has expired');
        const existing = await database_1.prisma.like.findUnique({ where: { userId_storyId: { userId, storyId } } });
        if (existing)
            return; // Idempotent
        await database_1.prisma.$transaction([
            database_1.prisma.like.create({ data: { userId, storyId } }),
            database_1.prisma.story.update({ where: { id: storyId }, data: { likesCount: { increment: 1 } } }),
        ]);
    },
    async unlikeStory(storyId, userId) {
        const existing = await database_1.prisma.like.findUnique({ where: { userId_storyId: { userId, storyId } } });
        if (!existing)
            return;
        await database_1.prisma.$transaction([
            database_1.prisma.like.delete({ where: { userId_storyId: { userId, storyId } } }),
            database_1.prisma.story.update({ where: { id: storyId }, data: { likesCount: { decrement: 1 } } }),
        ]);
    },
    // ── Story Replies ────────────────────────────────────────────────────────────
    async replyToStory(storyId, senderId, content) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.expiresAt < new Date())
            throw ApiError_1.ApiError.notFound('Story has expired');
        return database_1.prisma.storyReply.create({
            data: { storyId, senderId, content },
            include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });
    },
    async getStoryReplies(storyId, userId) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only view replies to your own stories');
        return database_1.prisma.storyReply.findMany({
            where: { storyId },
            include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
    },
};
//# sourceMappingURL=stories.service.js.map