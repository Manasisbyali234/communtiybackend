"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsService = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const ApiError_1 = require("../utils/ApiError");
const blocks_service_1 = require("./blocks.service");
const bullmq_1 = require("../config/bullmq");
const notifications_service_1 = require("./notifications.service");
const POST_SELECT = {
    id: true, content: true, mediaUrls: true, mediaType: true,
    likesCount: true, commentsCount: true, sharesCount: true,
    isDraft: true, scheduledAt: true,
    createdAt: true, updatedAt: true,
    author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    community: { select: { id: true, name: true, slug: true, avatarUrl: true } },
    hashtags: { select: { hashtag: { select: { id: true, name: true } } } },
};
/** Extract hashtags from post content */
function extractHashtags(content) {
    const matches = content.match(/#([a-zA-Z0-9_]+)/g) ?? [];
    return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
}
/** Upsert hashtags and link them to a post */
async function syncHashtags(postId, content) {
    const tags = extractHashtags(content);
    if (!tags.length)
        return;
    // Remove old hashtag links first
    const existing = await database_1.prisma.postHashtag.findMany({
        where: { postId },
        include: { hashtag: true },
    });
    const existingNames = existing.map((ph) => ph.hashtag.name);
    const toRemove = existing.filter((ph) => !tags.includes(ph.hashtag.name));
    const toAdd = tags.filter((t) => !existingNames.includes(t));
    // Decrement old hashtag counts
    if (toRemove.length > 0) {
        await database_1.prisma.$transaction([
            database_1.prisma.postHashtag.deleteMany({ where: { id: { in: toRemove.map((r) => r.id) } } }),
            ...toRemove.map((r) => database_1.prisma.hashtag.update({ where: { id: r.hashtagId }, data: { postsCount: { decrement: 1 } } })),
        ]);
    }
    // Upsert and link new hashtags
    for (const tag of toAdd) {
        const hashtag = await database_1.prisma.hashtag.upsert({
            where: { name: tag },
            create: { name: tag, postsCount: 1 },
            update: { postsCount: { increment: 1 } },
        });
        await database_1.prisma.postHashtag.upsert({
            where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
            create: { postId, hashtagId: hashtag.id },
            update: {},
        });
    }
}
exports.postsService = {
    async getFeed(userId, cursor, limit = 20) {
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        const [follows, memberships] = await Promise.all([
            database_1.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
            database_1.prisma.communityMember.findMany({ where: { userId }, select: { communityId: true } }),
        ]);
        const followingIds = follows.map((f) => f.followingId).filter((id) => !blockedIds.includes(id));
        const communityIds = memberships.map((m) => m.communityId);
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const posts = await database_1.prisma.post.findMany({
            ...args,
            where: {
                deletedAt: null,
                isDraft: false,
                scheduledAt: null,
                OR: [
                    { authorId: { in: followingIds } },
                    { communityId: { in: communityIds } },
                    { authorId: userId },
                ],
                authorId: { notIn: blockedIds },
            },
            select: POST_SELECT,
            orderBy: { createdAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(posts, limit);
    },
    async createPost(authorId, data) {
        if (data.communityId) {
            const member = await database_1.prisma.communityMember.findUnique({
                where: { communityId_userId: { communityId: data.communityId, userId: authorId } },
            });
            if (!member)
                throw ApiError_1.ApiError.forbidden('You must be a member of this community to post');
        }
        const post = await database_1.prisma.post.create({
            data: { authorId, ...data },
            select: POST_SELECT,
        });
        // Sync hashtags (only if publishing now)
        if (!data.isDraft && !data.scheduledAt) {
            await syncHashtags(post.id, data.content);
        }
        // Schedule publication job
        if (data.scheduledAt && !data.isDraft) {
            const delay = data.scheduledAt.getTime() - Date.now();
            if (delay > 0) {
                const queue = (0, bullmq_1.getQueue)(bullmq_1.QUEUE_NAMES.SCHEDULED_POST);
                await queue.add('publish', { postId: post.id }, { delay, jobId: `post:${post.id}` });
            }
        }
        return post;
    },
    async getPost(postId, viewerId) {
        const post = await database_1.prisma.post.findFirst({
            where: { id: postId, deletedAt: null },
            select: {
                ...POST_SELECT,
                ...(viewerId ? {
                    likes: { where: { userId: viewerId }, select: { id: true } },
                    bookmarks: { where: { userId: viewerId }, select: { id: true } },
                } : {}),
            },
        });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        return post;
    },
    async updatePost(postId, userId, data) {
        const post = await database_1.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        if (post.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only edit your own posts');
        const updated = await database_1.prisma.post.update({
            where: { id: postId },
            data,
            select: POST_SELECT,
        });
        if (data.content)
            await syncHashtags(postId, data.content);
        return updated;
    },
    async deletePost(postId, userId, role) {
        const post = await database_1.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        if (post.authorId !== userId && role !== 'ADMIN' && role !== 'MODERATOR') {
            throw ApiError_1.ApiError.forbidden('Not authorized to delete this post');
        }
        // Soft delete
        await database_1.prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
    },
    async publishDraft(postId, userId) {
        const post = await database_1.prisma.post.findFirst({ where: { id: postId, deletedAt: null, isDraft: true, authorId: userId } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Draft not found');
        const updated = await database_1.prisma.post.update({
            where: { id: postId },
            data: { isDraft: false, scheduledAt: null },
            select: POST_SELECT,
        });
        await syncHashtags(postId, post.content);
        return updated;
    },
    async getDrafts(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const posts = await database_1.prisma.post.findMany({
            ...args,
            where: { authorId: userId, isDraft: true, deletedAt: null },
            select: POST_SELECT,
            orderBy: { updatedAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(posts, limit);
    },
    async likePost(postId, userId) {
        const post = await database_1.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        const existing = await database_1.prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
        if (existing)
            return; // Already liked, idempotent
        await database_1.prisma.$transaction([
            database_1.prisma.like.create({ data: { userId, postId } }),
            database_1.prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
        ]);
        if (post.authorId !== userId) {
            await notifications_service_1.notificationsService.create({
                recipientId: post.authorId,
                type: 'NEW_LIKE',
                actorId: userId,
                entityId: postId,
                entityType: 'Post',
            });
        }
    },
    async unlikePost(postId, userId) {
        const existing = await database_1.prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
        if (!existing)
            return;
        await database_1.prisma.$transaction([
            database_1.prisma.like.delete({ where: { userId_postId: { userId, postId } } }),
            database_1.prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
        ]);
    },
    async getTrendingPosts(userId, cursor, limit = 20) {
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const posts = await database_1.prisma.post.findMany({
            ...args,
            where: {
                deletedAt: null,
                isDraft: false,
                scheduledAt: null,
                createdAt: { gte: since },
                authorId: { notIn: blockedIds },
            },
            select: POST_SELECT,
            orderBy: [{ likesCount: 'desc' }, { commentsCount: 'desc' }, { createdAt: 'desc' }],
        });
        return (0, pagination_1.buildCursorPage)(posts, limit);
    },
};
//# sourceMappingURL=posts.service.js.map