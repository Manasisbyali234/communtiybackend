"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const blocks_service_1 = require("./blocks.service");
const CACHE_TTL = 600; // 10 minutes
async function withCache(key, fn) {
    const cached = await redis_1.redis.get(key);
    if (cached)
        return JSON.parse(cached);
    const result = await fn();
    await redis_1.redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
    return result;
}
exports.exploreService = {
    async getTrendingPosts(userId, limit = 20) {
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
        return withCache(`explore:trending_posts:${limit}`, () => database_1.prisma.post.findMany({
            where: {
                deletedAt: null,
                isDraft: false,
                scheduledAt: null,
                createdAt: { gte: since },
                authorId: { notIn: blockedIds },
            },
            select: {
                id: true, content: true, mediaUrls: true, mediaType: true,
                likesCount: true, commentsCount: true, createdAt: true,
                author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                community: { select: { id: true, name: true, slug: true } },
            },
            orderBy: [{ likesCount: 'desc' }, { commentsCount: 'desc' }],
            take: limit,
        }));
    },
    async getTrendingCommunities(limit = 10) {
        return withCache(`explore:trending_communities:${limit}`, () => database_1.prisma.community.findMany({
            where: { isPrivate: false },
            orderBy: { memberCount: 'desc' },
            take: limit,
            select: { id: true, name: true, slug: true, avatarUrl: true, memberCount: true, category: true, description: true },
        }));
    },
    async getSuggestedUsers(userId, limit = 10) {
        // Users followed by people you follow (2nd degree connections)
        const following = await database_1.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        if (!followingIds.length) {
            // Fallback: most followed users
            return database_1.prisma.user.findMany({
                where: { id: { not: userId }, isActive: true, deletedAt: null },
                orderBy: { followers: { _count: 'desc' } },
                take: limit,
                select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
            });
        }
        const secondDegree = await database_1.prisma.follow.findMany({
            where: {
                followerId: { in: followingIds },
                followingId: { notIn: [...followingIds, userId] },
            },
            select: { followingId: true },
        });
        const candidateIds = [...new Set(secondDegree.map((f) => f.followingId))].slice(0, limit * 2);
        return database_1.prisma.user.findMany({
            where: { id: { in: candidateIds }, isActive: true, deletedAt: null },
            take: limit,
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        });
    },
    async getSuggestedCommunities(userId, limit = 10) {
        // Communities in categories the user already engages with
        const memberships = await database_1.prisma.communityMember.findMany({
            where: { userId },
            include: { community: { select: { category: true } } },
        });
        const categories = [...new Set(memberships.map((m) => m.community.category))];
        const joinedIds = memberships.map((m) => m.communityId);
        if (!categories.length) {
            return database_1.prisma.community.findMany({
                where: { isPrivate: false, id: { notIn: joinedIds } },
                orderBy: { memberCount: 'desc' },
                take: limit,
                select: { id: true, name: true, slug: true, avatarUrl: true, memberCount: true, category: true, description: true },
            });
        }
        return database_1.prisma.community.findMany({
            where: {
                isPrivate: false,
                id: { notIn: joinedIds },
                category: { in: categories },
            },
            orderBy: { memberCount: 'desc' },
            take: limit,
            select: { id: true, name: true, slug: true, avatarUrl: true, memberCount: true, category: true, description: true },
        });
    },
    async getTrendingHashtags(limit = 20) {
        return withCache(`explore:trending_hashtags:${limit}`, () => database_1.prisma.hashtag.findMany({
            orderBy: { postsCount: 'desc' },
            take: limit,
            select: { id: true, name: true, postsCount: true },
        }));
    },
    async getPostsByHashtag(hashtagName, userId, cursor, limit = 20) {
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        const tag = hashtagName.replace(/^#/, '').toLowerCase();
        const hashtag = await database_1.prisma.hashtag.findUnique({ where: { name: tag } });
        if (!hashtag)
            return { items: [], nextCursor: null, hasMore: false };
        const posts = await database_1.prisma.postHashtag.findMany({
            where: { hashtagId: hashtag.id },
            include: {
                post: {
                    include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
                    where: { deletedAt: null, isDraft: false, authorId: { notIn: blockedIds } },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        const hasMore = posts.length > limit;
        const items = posts.slice(0, limit).map((ph) => ph.post).filter(Boolean);
        const nextCursor = hasMore ? posts[limit - 1]?.id : null;
        return { items, nextCursor, hasMore };
    },
};
//# sourceMappingURL=explore.service.js.map