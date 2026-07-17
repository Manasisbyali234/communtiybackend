"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
exports.moderationService = {
    async submitReport(reporterId, data) {
        if (!data.postId && !data.reportedUserId) {
            throw ApiError_1.ApiError.badRequest('Must report either a post or a user');
        }
        return database_1.prisma.report.create({ data: { reporterId, ...data } });
    },
    async listReports(params) {
        const { status, skip = 0, take = 20 } = params;
        return database_1.prisma.report.findMany({
            where: { ...(status ? { status } : {}) },
            include: {
                reporter: { select: { id: true, username: true } },
                reportedUser: { select: { id: true, username: true } },
                post: { select: { id: true, content: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    },
    async updateReport(reportId, status) {
        return database_1.prisma.report.update({ where: { id: reportId }, data: { status, reviewedAt: new Date() } });
    },
    async banUser(userId) {
        await database_1.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
        await database_1.prisma.refreshToken.deleteMany({ where: { userId } });
    },
    async unbanUser(userId) {
        await database_1.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    },
    async removePost(postId) {
        const post = await database_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw ApiError_1.ApiError.notFound('Post not found');
        await database_1.prisma.post.delete({ where: { id: postId } });
    },
};
//# sourceMappingURL=moderation.service.js.map