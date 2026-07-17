"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookmarksService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
exports.bookmarksService = {
    async addBookmark(userId, postId) {
        const post = await database_1.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        await database_1.prisma.bookmark.upsert({
            where: { userId_postId: { userId, postId } },
            create: { userId, postId },
            update: {},
        });
    },
    async removeBookmark(userId, postId) {
        await database_1.prisma.bookmark.deleteMany({ where: { userId, postId } });
    },
    async getBookmarks(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const bookmarks = await database_1.prisma.bookmark.findMany({
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
        return (0, pagination_1.buildCursorPage)(items, limit);
    },
};
//# sourceMappingURL=bookmarks.service.js.map