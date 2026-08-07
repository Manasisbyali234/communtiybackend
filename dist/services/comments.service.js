"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const notifications_service_1 = require("./notifications.service");
const COMMENT_SELECT = {
    id: true, content: true, likesCount: true, createdAt: true, parentId: true,
    author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    _count: { select: { replies: true } },
};
exports.commentsService = {
    async getComments(postId, parentId, userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const comments = await database_1.prisma.comment.findMany({
            ...args,
            where: { postId, parentId: parentId ?? null },
            select: {
                ...COMMENT_SELECT,
                likes: { where: { userId }, select: { id: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        const page = (0, pagination_1.buildCursorPage)(comments, limit);
        return {
            ...page,
            data: page.data.map(({ likes, ...comment }) => ({ ...comment, isLiked: likes.length > 0 })),
        };
    },
    async addComment(postId, authorId, content, parentId) {
        const post = await database_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        const [comment] = await database_1.prisma.$transaction([
            database_1.prisma.comment.create({ data: { postId, authorId, content, parentId: parentId ?? null }, select: COMMENT_SELECT }),
            database_1.prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
        ]);
        if (parentId) {
            const parent = await database_1.prisma.comment.findUnique({ where: { id: parentId } });
            if (parent && parent.authorId !== authorId) {
                const actor = await database_1.prisma.user.findUnique({ where: { id: authorId }, select: { displayName: true } });
                await notifications_service_1.notificationsService.create({
                    recipientId: parent.authorId,
                    type: 'COMMENT',
                    actorId: authorId,
                    entityId: comment.id,
                    entityType: 'Comment',
                    body: `${actor?.displayName ?? 'Someone'} replied to your comment.`,
                });
            }
        }
        else if (post.authorId !== authorId) {
            const actor = await database_1.prisma.user.findUnique({ where: { id: authorId }, select: { displayName: true } });
            await notifications_service_1.notificationsService.create({
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
    async updateComment(commentId, userId, content) {
        const comment = await database_1.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw ApiError_1.ApiError.notFound('Comment not found');
        if (comment.authorId !== userId)
            throw ApiError_1.ApiError.forbidden('You can only edit your own comments');
        return database_1.prisma.comment.update({ where: { id: commentId }, data: { content }, select: COMMENT_SELECT });
    },
    async deleteComment(commentId, postId, userId, role) {
        const comment = await database_1.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw ApiError_1.ApiError.notFound('Comment not found');
        if (comment.authorId !== userId && role !== 'ADMIN' && role !== 'MODERATOR') {
            throw ApiError_1.ApiError.forbidden('Not authorized to delete this comment');
        }
        await database_1.prisma.$transaction([
            database_1.prisma.comment.delete({ where: { id: commentId } }),
            database_1.prisma.post.update({ where: { id: postId }, data: { commentsCount: { decrement: 1 } } }),
        ]);
    },
    async likeComment(commentId, userId) {
        const comment = await database_1.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw ApiError_1.ApiError.notFound('Comment not found');
        const existingLike = await database_1.prisma.like.findUnique({ where: { userId_commentId: { userId, commentId } } });
        const isLiked = !existingLike;
        const updatedComment = await database_1.prisma.$transaction(async (tx) => {
            if (existingLike) {
                await tx.like.delete({ where: { id: existingLike.id } });
            }
            else {
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
//# sourceMappingURL=comments.service.js.map