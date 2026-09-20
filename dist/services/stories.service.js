"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.storiesService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const bullmq_1 = require("../config/bullmq");
const ApiError_1 = require("../utils/ApiError");
const notifications_service_1 = require("./notifications.service");
const STORY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
exports.storiesService = {
    async getFeed(userId) {
        // In a community app stories are visible to all approved members —
        // not restricted to followed accounts only.
        const stories = await database_1.prisma.story.findMany({
            where: {
                expiresAt: { gt: new Date() },
                author: { approvalStatus: 'APPROVED', isBanned: false, isActive: true },
            },
            include: {
                author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                views: { where: { viewerId: userId }, select: { viewerId: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Group by author
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
        // Current user's own stories go first, then by most recent story in each group
        const currentUserGroup = grouped.get(userId);
        const otherGroups = Array.from(grouped.values())
            .filter((g) => g.user.id !== userId)
            .sort((a, b) => new Date(b.stories[0].createdAt).getTime() - new Date(a.stories[0].createdAt).getTime());
        return currentUserGroup ? [currentUserGroup, ...otherGroups] : otherGroups;
    },
    async getById(storyId, requesterId) {
        const story = await database_1.prisma.story.findUnique({
            where: { id: storyId },
            include: {
                author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
        });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        // Allow the author to view their own expired story (e.g. to delete it)
        if (story.expiresAt < new Date() && story.authorId !== requesterId)
            throw ApiError_1.ApiError.notFound('Story has expired');
        return story;
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
        // Stories are visible to every approved, active member. Notify active
        // clients so a mounted home feed immediately refreshes its stories row.
        try {
            const { getIO } = await Promise.resolve().then(() => __importStar(require('../sockets/index')));
            getIO().emit('story:created', { storyId: story.id, authorId });
        }
        catch {
            // Socket.io is intentionally absent in service/unit-test contexts.
        }
        return story;
    },
    async update(storyId, userId, data) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            throw ApiError_1.ApiError.notFound('Story not found');
        if (story.expiresAt <= new Date())
            throw ApiError_1.ApiError.notFound('Story has expired');
        if (story.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only edit your own stories');
        return database_1.prisma.story.update({
            where: { id: storyId },
            data,
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });
    },
    async delete(storyId, userId) {
        const story = await database_1.prisma.story.findUnique({ where: { id: storyId } });
        if (!story)
            return; // Already deleted (e.g. by expiry worker) — treat as success
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
        // Count a viewer once. The former upsert incremented the counter every
        // time the same person reopened a story.
        const created = await database_1.prisma.storyView.createMany({
            data: [{ storyId, viewerId }],
            skipDuplicates: true,
        });
        if (created.count > 0) {
            await database_1.prisma.story.update({ where: { id: storyId }, data: { viewCount: { increment: 1 } } });
        }
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
        if (story.authorId !== userId) {
            const actor = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
            await notifications_service_1.notificationsService.create({
                recipientId: story.authorId,
                type: 'STORY_LIKE',
                actorId: userId,
                entityId: storyId,
                entityType: 'Story',
                body: `${actor?.displayName ?? 'Someone'} liked your story.`,
            });
        }
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
        const reply = await database_1.prisma.storyReply.create({
            data: { storyId, senderId, content },
            include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });
        if (story.authorId !== senderId) {
            await notifications_service_1.notificationsService.create({
                recipientId: story.authorId,
                type: 'STORY_REPLY',
                actorId: senderId,
                entityId: storyId,
                entityType: 'Story',
                body: `${reply.sender.displayName} replied to your story.`,
            });
        }
        return reply;
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