import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { getQueue, QUEUE_NAMES } from '../config/bullmq';
import { ApiError } from '../utils/ApiError';
import { MediaType } from '@prisma/client';
import { notificationsService } from './notifications.service';

const STORY_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export const storiesService = {
  async getFeed(userId: string) {
    const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const followingIds = [...follows.map((f) => f.followingId), userId];

    const stories = await prisma.story.findMany({
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
    const grouped = new Map<string, { user: (typeof stories)[0]['author']; stories: typeof stories; hasUnseen: boolean }>();
    for (const story of stories) {
      const key = story.authorId;
      if (!grouped.has(key)) {
        grouped.set(key, { user: story.author, stories: [], hasUnseen: false });
      }
      const group = grouped.get(key)!;
      group.stories.push(story);
      if (story.views.length === 0) group.hasUnseen = true;
    }

    return Array.from(grouped.values());
  },

  async getById(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.expiresAt < new Date()) throw ApiError.notFound('Story has expired');
    return story;
  },

  async create(authorId: string, mediaUrl: string, mediaType: MediaType) {
    const expiresAt = new Date(Date.now() + STORY_TTL_SECONDS * 1000);

    const story = await prisma.story.create({
      data: { authorId, mediaUrl, mediaType, expiresAt },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    // Set Redis TTL for fast-path check
    await redis.set(`story:${story.id}`, '1', 'EX', STORY_TTL_SECONDS);

    // Schedule BullMQ cleanup job
    const queue = getQueue(QUEUE_NAMES.STORY_EXPIRY);
    await queue.add('expire', { storyId: story.id }, { delay: STORY_TTL_SECONDS * 1000 });

    return story;
  },

  async delete(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.authorId !== userId) throw ApiError.forbidden('You can only delete your own stories');
    await prisma.story.delete({ where: { id: storyId } });
    await redis.del(`story:${storyId}`);
  },

  async recordView(storyId: string, viewerId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.expiresAt < new Date()) throw ApiError.notFound('Story has expired');

    await prisma.$transaction([
      prisma.storyView.upsert({
        where: { storyId_viewerId: { storyId, viewerId } },
        create: { storyId, viewerId },
        update: {},
      }),
      prisma.story.update({ where: { id: storyId }, data: { viewCount: { increment: 1 } } }),
    ]);
  },

  async getViewers(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.authorId !== userId) throw ApiError.forbidden('You can only view viewers of your own stories');

    return prisma.storyView.findMany({
      where: { storyId },
      include: { story: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ── Story Likes ──────────────────────────────────────────────────────────────
  async likeStory(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.expiresAt < new Date()) throw ApiError.notFound('Story has expired');

    const existing = await prisma.like.findUnique({ where: { userId_storyId: { userId, storyId } } });
    if (existing) return; // Idempotent

    await prisma.$transaction([
      prisma.like.create({ data: { userId, storyId } }),
      prisma.story.update({ where: { id: storyId }, data: { likesCount: { increment: 1 } } }),
    ]);

    if (story.authorId !== userId) {
      const actor = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
      await notificationsService.create({
        recipientId: story.authorId,
        type: 'STORY_LIKE',
        actorId: userId,
        entityId: storyId,
        entityType: 'Story',
        body: `${actor?.displayName ?? 'Someone'} liked your story.`,
      });
    }
  },

  async unlikeStory(storyId: string, userId: string) {
    const existing = await prisma.like.findUnique({ where: { userId_storyId: { userId, storyId } } });
    if (!existing) return;

    await prisma.$transaction([
      prisma.like.delete({ where: { userId_storyId: { userId, storyId } } }),
      prisma.story.update({ where: { id: storyId }, data: { likesCount: { decrement: 1 } } }),
    ]);
  },

  // ── Story Replies ────────────────────────────────────────────────────────────
  async replyToStory(storyId: string, senderId: string, content: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.expiresAt < new Date()) throw ApiError.notFound('Story has expired');

    const reply = await prisma.storyReply.create({
      data: { storyId, senderId, content },
      include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    if (story.authorId !== senderId) {
      await notificationsService.create({
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

  async getStoryReplies(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw ApiError.notFound('Story not found');
    if (story.authorId !== userId) throw ApiError.forbidden('You can only view replies to your own stories');

    return prisma.storyReply.findMany({
      where: { storyId },
      include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
};
