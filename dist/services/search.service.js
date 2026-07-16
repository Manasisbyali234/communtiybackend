"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const blocks_service_1 = require("./blocks.service");
const CACHE_TTL = 300; // 5 minutes
async function withCache(key, fn) {
    const cached = await redis_1.redis.get(key);
    if (cached)
        return JSON.parse(cached);
    const result = await fn();
    await redis_1.redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
    return result;
}
exports.searchService = {
    async search(query, userId, limit = 10) {
        const q = query.trim();
        if (!q)
            return { users: [], posts: [], communities: [], events: [], hashtags: [] };
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        const cacheKey = `search:${q}:${limit}`;
        return withCache(cacheKey, async () => {
            const [users, posts, communities, events, hashtags] = await Promise.all([
                database_1.prisma.user.findMany({
                    where: {
                        isActive: true,
                        deletedAt: null,
                        id: { notIn: blockedIds },
                        OR: [
                            { displayName: { contains: q, mode: 'insensitive' } },
                            { username: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
                    take: limit,
                }),
                database_1.prisma.post.findMany({
                    where: {
                        content: { contains: q, mode: 'insensitive' },
                        deletedAt: null,
                        isDraft: false,
                        authorId: { notIn: blockedIds },
                    },
                    select: {
                        id: true, content: true, createdAt: true,
                        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                    },
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                database_1.prisma.community.findMany({
                    where: {
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    select: { id: true, name: true, slug: true, avatarUrl: true, memberCount: true, category: true },
                    take: limit,
                }),
                database_1.prisma.event.findMany({
                    where: {
                        OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { location: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    select: { id: true, title: true, startsAt: true, location: true, rsvpCount: true },
                    take: limit,
                }),
                database_1.prisma.hashtag.findMany({
                    where: { name: { contains: q.replace(/^#/, ''), mode: 'insensitive' } },
                    select: { id: true, name: true, postsCount: true },
                    orderBy: { postsCount: 'desc' },
                    take: limit,
                }),
            ]);
            return { users, posts, communities, events, hashtags };
        });
    },
    async searchUsers(query, userId, limit = 20) {
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        return database_1.prisma.user.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                id: { notIn: blockedIds },
                OR: [
                    { displayName: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
            take: limit,
        });
    },
    async searchPosts(query, userId, limit = 20) {
        const blockedIds = await blocks_service_1.blocksService.getBlockedIds(userId);
        return database_1.prisma.post.findMany({
            where: {
                content: { contains: query, mode: 'insensitive' },
                deletedAt: null,
                isDraft: false,
                authorId: { notIn: blockedIds },
            },
            include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    },
    async searchCommunities(query, limit = 20) {
        return database_1.prisma.community.findMany({
            where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
            take: limit,
            orderBy: { memberCount: 'desc' },
        });
    },
    async searchEvents(query, limit = 20) {
        return database_1.prisma.event.findMany({
            where: { OR: [{ title: { contains: query, mode: 'insensitive' } }, { location: { contains: query, mode: 'insensitive' } }] },
            take: limit,
            orderBy: { startsAt: 'asc' },
        });
    },
    async searchHashtags(query, limit = 20) {
        const tag = query.replace(/^#/, '').toLowerCase();
        return database_1.prisma.hashtag.findMany({
            where: { name: { contains: tag, mode: 'insensitive' } },
            orderBy: { postsCount: 'desc' },
            take: limit,
        });
    },
};
//# sourceMappingURL=search.service.js.map