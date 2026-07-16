import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { blocksService } from './blocks.service';

const CACHE_TTL = 300; // 5 minutes

async function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const result = await fn();
  await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

export const searchService = {
  async search(query: string, userId: string, limit = 10) {
    const q = query.trim();
    if (!q) return { users: [], posts: [], communities: [], events: [], hashtags: [] };

    const blockedIds = await blocksService.getBlockedIds(userId);
    const cacheKey = `search:${q}:${limit}`;

    return withCache(cacheKey, async () => {
      const [users, posts, communities, events, hashtags] = await Promise.all([
        prisma.user.findMany({
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

        prisma.post.findMany({
          where: {
            content: { contains: q, mode: 'insensitive' },
            deletedAt: null,
            isDraft: false,
            authorId: { notIn: blockedIds },
            OR: [{ communityId: null }, { status: 'APPROVED' }],
          },
          select: {
            id: true, content: true, createdAt: true,
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),

        prisma.community.findMany({
          where: {
            status: 'APPROVED',
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, slug: true, avatarUrl: true, memberCount: true, category: true },
          take: limit,
        }),

        prisma.event.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, title: true, startsAt: true, location: true, rsvpCount: true },
          take: limit,
        }),

        prisma.hashtag.findMany({
          where: { name: { contains: q.replace(/^#/, ''), mode: 'insensitive' } },
          select: { id: true, name: true, postsCount: true },
          orderBy: { postsCount: 'desc' },
          take: limit,
        }),
      ]);

      return { users, posts, communities, events, hashtags };
    });
  },

  async searchUsers(query: string, userId: string, limit = 20) {
    const blockedIds = await blocksService.getBlockedIds(userId);
    return prisma.user.findMany({
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

  async searchPosts(query: string, userId: string, limit = 20) {
    const blockedIds = await blocksService.getBlockedIds(userId);
    return prisma.post.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
        deletedAt: null,
        isDraft: false,
        authorId: { notIn: blockedIds },
        OR: [{ communityId: null }, { status: 'APPROVED' }],
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  async searchCommunities(query: string, limit = 20) {
    return prisma.community.findMany({
      where: { status: 'APPROVED', OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
      take: limit,
      orderBy: { memberCount: 'desc' },
    });
  },

  async searchEvents(query: string, limit = 20) {
    return prisma.event.findMany({
      where: { OR: [{ title: { contains: query, mode: 'insensitive' } }, { location: { contains: query, mode: 'insensitive' } }] },
      take: limit,
      orderBy: { startsAt: 'asc' },
    });
  },

  async searchHashtags(query: string, limit = 20) {
    const tag = query.replace(/^#/, '').toLowerCase();
    return prisma.hashtag.findMany({
      where: { name: { contains: tag, mode: 'insensitive' } },
      orderBy: { postsCount: 'desc' },
      take: limit,
    });
  },
};
