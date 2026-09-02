import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { notificationsService } from './notifications.service';
import { CommunityMemberStatus, EventStatus, RsvpStatus } from '@prisma/client';
export const usersService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, displayName: true, bio: true,
        avatarUrl: true, bannerUrl: true, coverImage: true, familyName: true,
        dob: true, gender: true, country: true, state: true, district: true,
        city: true, nativePlace: true, currentLocation: true, village: true,
        occupation: true, profession: true, company: true, education: true,
        skills: true, languages: true, interests: true, role: true,
        isVerified: true, phone: true, createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            // Do not count rejected or pending community applications as memberships.
            communityMembers: { where: { status: CommunityMemberStatus.ACTIVE } },
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

  async updateMe(userId: string, data: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string; coverImage?: string | null; familyName?: string; dob?: string; gender?: string; country?: string; state?: string; district?: string; city?: string; nativePlace?: string; currentLocation?: string; village?: string; occupation?: string; profession?: string; company?: string; education?: string; skills?: string; languages?: string; interests?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, username: true, displayName: true, bio: true,
        avatarUrl: true, bannerUrl: true, coverImage: true, familyName: true,
        dob: true, gender: true, country: true, state: true, district: true,
        city: true, nativePlace: true, currentLocation: true, village: true,
        occupation: true, profession: true, company: true, education: true,
        skills: true, languages: true, interests: true,
      },
    });
  },

  async deactivateMe(userId: string, reason?: string) {
    const deletedAt = new Date();
    await prisma.user.update({
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
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async getPublicProfile(userId: string, viewerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true, username: true, displayName: true, bio: true,
        avatarUrl: true, bannerUrl: true, coverImage: true, familyName: true,
        dob: true, gender: true, country: true, state: true, district: true,
        city: true, nativePlace: true, currentLocation: true, village: true,
        occupation: true, profession: true, company: true, education: true,
        skills: true, languages: true, interests: true, isVerified: true,
        role: true, createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            // A help count represents concrete responses, not requests created.
            helpOffers: true,
            // The data model records attendance through a GOING RSVP.
            eventRsvps: { where: { status: 'GOING' } },
            communityMembers: { where: { status: CommunityMemberStatus.ACTIVE } },
          },
        },
      },
    });
    if (!user) throw ApiError.notFound('User not found');

    const isFollowing = viewerId !== userId
      ? !!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: userId } } }))
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

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw ApiError.badRequest('You cannot follow yourself');
    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw ApiError.notFound('User not found');
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

    const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { displayName: true } });
    await notificationsService.create({
      recipientId: followingId,
      type: 'FOLLOW',
      actorId: followerId,
      entityId: followerId,
      entityType: 'User',
      body: `${follower?.displayName ?? 'Someone'} started following you.`,
    });
  },

  async unfollowUser(followerId: string, followingId: string) {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  },

  async getFollowers(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const follows = await prisma.follow.findMany({
      ...args,
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => f.follower);
    return buildCursorPage(items, limit);
  },

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const follows = await prisma.follow.findMany({
      ...args,
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => f.following);
    return buildCursorPage(items, limit);
  },

  async getUserPosts(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const posts = await prisma.post.findMany({
      ...args,
      // Posts are soft-deleted, so never return records the author has deleted.
      where: { authorId: userId, deletedAt: null },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return buildCursorPage(posts, limit);
  },

  async getUserJoinedEvents(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const events = await prisma.event.findMany({
      ...args,
      where: {
        status: EventStatus.APPROVED,
        rsvps: { some: { userId, status: RsvpStatus.GOING } },
      },
      include: { community: { select: { id: true, name: true, slug: true } } },
      orderBy: { startsAt: 'desc' },
    });
    return buildCursorPage(events, limit);
  },

  async updatePushToken(userId: string, expoPushToken: string) {
    await prisma.deviceToken.upsert({
      where: { token: expoPushToken },
      create: { userId, token: expoPushToken, platform: 'android' },
      update: { userId },
    });
  },
};
