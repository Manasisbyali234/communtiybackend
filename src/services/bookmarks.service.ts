import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';

export const bookmarksService = {
  async addBookmark(userId: string, postId: string) {
    const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) throw ApiError.notFound('Post not found');

    await prisma.bookmark.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
  },

  async removeBookmark(userId: string, postId: string) {
    await prisma.bookmark.deleteMany({ where: { userId, postId } });
  },

  async getBookmarks(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const bookmarks = await prisma.bookmark.findMany({
      ...args,
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            community: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = bookmarks
      .filter((b) => !b.post.deletedAt)
      .map((b) => b.post);

    return buildCursorPage(items, limit);
  },
};
