import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { notificationsService } from './notifications.service';
const COMMENT_SELECT = {
  id: true, content: true, likesCount: true, createdAt: true, parentId: true,
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  _count: { select: { replies: true } },
};

export const commentsService = {
  async getComments(postId: string, parentId: string | null, userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const comments = await prisma.comment.findMany({
      ...args,
      where: { postId, parentId: parentId ?? null },
      select: {
        ...COMMENT_SELECT,
        likes: { where: { userId }, select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const page = buildCursorPage(comments, limit);
    return {
      ...page,
      data: page.data.map(({ likes, ...comment }) => ({ ...comment, isLiked: likes.length > 0 })),
    };
  },

  async addComment(postId: string, authorId: string, content: string, parentId?: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound('Post not found');

    const [comment] = await prisma.$transaction([
      prisma.comment.create({ data: { postId, authorId, content, parentId: parentId ?? null }, select: COMMENT_SELECT }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
    ]);

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (parent && parent.authorId !== authorId) {
        const actor = await prisma.user.findUnique({ where: { id: authorId }, select: { displayName: true } });
        await notificationsService.create({
          recipientId: parent.authorId,
          type: 'COMMENT',
          actorId: authorId,
          entityId: comment.id,
          entityType: 'Comment',
          body: `${actor?.displayName ?? 'Someone'} replied to your comment.`,
        });
      }
    } else if (post.authorId !== authorId) {
      const actor = await prisma.user.findUnique({ where: { id: authorId }, select: { displayName: true } });
      await notificationsService.create({
        recipientId: post.authorId,
        type: 'COMMENT',
        actorId: authorId,
        entityId: comment.id,
        entityType: 'Comment',
        body: `${actor?.displayName ?? 'Someone'} commented on your post.`,
      });
    }

    return comment;
  },

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId) throw ApiError.forbidden('You can only edit your own comments');
    return prisma.comment.update({ where: { id: commentId }, data: { content }, select: COMMENT_SELECT });
  },

  async deleteComment(commentId: string, postId: string, userId: string, role: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId && role !== 'ADMIN' && role !== 'MODERATOR') {
      throw ApiError.forbidden('Not authorized to delete this comment');
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { decrement: 1 } } }),
    ]);
  },

  async likeComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw ApiError.notFound('Comment not found');

    const existingLike = await prisma.like.findUnique({ where: { userId_commentId: { userId, commentId } } });
    const isLiked = !existingLike;

    const updatedComment = await prisma.$transaction(async (tx) => {
      if (existingLike) {
        await tx.like.delete({ where: { id: existingLike.id } });
      } else {
        await tx.like.create({ data: { userId, commentId } });
      }

      return tx.comment.update({
        where: { id: commentId },
        data: { likesCount: { [isLiked ? 'increment' : 'decrement']: 1 } },
        select: { likesCount: true },
      });
    });

    return { isLiked, likesCount: Math.max(0, updatedComment.likesCount) };
  },
};
