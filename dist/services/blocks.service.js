"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blocksService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
exports.blocksService = {
    async blockUser(blockerId, blockedId) {
        if (blockerId === blockedId)
            throw ApiError_1.ApiError.badRequest('Cannot block yourself');
        const target = await database_1.prisma.user.findUnique({ where: { id: blockedId } });
        if (!target)
            throw ApiError_1.ApiError.notFound('User not found');
        await database_1.prisma.userBlock.upsert({
            where: { blockerId_blockedId: { blockerId, blockedId } },
            create: { blockerId, blockedId },
            update: {},
        });
        // Automatically unfollow both directions
        await database_1.prisma.follow.deleteMany({
            where: {
                OR: [
                    { followerId: blockerId, followingId: blockedId },
                    { followerId: blockedId, followingId: blockerId },
                ],
            },
        });
    },
    async unblockUser(blockerId, blockedId) {
        await database_1.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
    },
    async isBlocked(blockerId, blockedId) {
        const block = await database_1.prisma.userBlock.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        return !!block;
    },
    async getBlockedUsers(userId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const blocks = await database_1.prisma.userBlock.findMany({
            ...args,
            where: { blockerId: userId },
            include: { blocked: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const items = blocks.map((b) => b.blocked);
        return (0, pagination_1.buildCursorPage)(items, limit);
    },
    /**
     * Returns blocked user IDs (both directions) for filtering feeds/search.
     */
    async getBlockedIds(userId) {
        const blocks = await database_1.prisma.userBlock.findMany({
            where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
            select: { blockerId: true, blockedId: true },
        });
        return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
    },
};
//# sourceMappingURL=blocks.service.js.map