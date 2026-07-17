import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';

export const blocksService = {
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw ApiError.badRequest('Cannot block yourself');

    const target = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) throw ApiError.notFound('User not found');

    await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });

    // Automatically unfollow both directions
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });
  },

  async unblockUser(blockerId: string, blockedId: string) {
    await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  },

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  },

  async getBlockedUsers(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const blocks = await prisma.userBlock.findMany({
      ...args,
      where: { blockerId: userId },
      include: { blocked: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const items = blocks.map((b) => b.blocked);
    return buildCursorPage(items, limit);
  },

  /**
   * Returns blocked user IDs (both directions) for filtering feeds/search.
   */
  async getBlockedIds(userId: string): Promise<string[]> {
    const blocks = await prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
  },
};
