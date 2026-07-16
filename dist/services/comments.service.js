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
    async getComments(postId, parentId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const comments = await database_1.prisma.comment.findMany({
            ...args,
            where: { postId, parentId: parentId ?? null },
            select: COMMENT_SELECT,
            orderBy: { createdAt: 'asc' },
        });
        return (0, pagination_1.buildCursorPage)(comments, limit);
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
                await notifications_service_1.notificationsService.create({
                    recipientId: parent.authorId,
                    type: 'NEW_REPLY',
                    actorId: authorId,
                    entityId: comment.id,
                    entityType: 'Comment',
                });
            }
        }
        else if (post.authorId !== authorId) {
            await notifications_service_1.notificationsService.create({
                recipientId: post.authorId,
                type: 'NEW_COMMENT',
                actorId: authorId,
                entityId: comment.id,
                entityType: 'Comment',
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
        await database_1.prisma.$transaction([
            database_1.prisma.like.upsert({
                where: { userId_commentId: { userId, commentId } },
                create: { userId, commentId },
                update: {},
            }),
            database_1.prisma.comment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } }),
        ]);
    },
};
//# sourceMappingURL=comments.service.js.map