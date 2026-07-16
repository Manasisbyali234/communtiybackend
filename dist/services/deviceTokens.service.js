"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceTokensService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
exports.deviceTokensService = {
    async register(userId, token, platform) {
        // Upsert — reassign token to this user if it was previously associated with another
        await database_1.prisma.deviceToken.deleteMany({ where: { token, userId: { not: userId } } });
        return database_1.prisma.deviceToken.upsert({
            where: { token },
            create: { userId, token, platform },
            update: { userId, platform },
        });
    },
    async unregister(userId, tokenId) {
        const dt = await database_1.prisma.deviceToken.findFirst({ where: { id: tokenId, userId } });
        if (!dt)
            throw ApiError_1.ApiError.notFound('Device token not found');
        await database_1.prisma.deviceToken.delete({ where: { id: tokenId } });
    },
    async getTokensForUser(userId) {
        const tokens = await database_1.prisma.deviceToken.findMany({
            where: { userId },
            select: { token: true },
        });
        return tokens.map((t) => t.token);
    },
    async listDevices(userId) {
        return database_1.prisma.deviceToken.findMany({
            where: { userId },
            select: { id: true, platform: true, token: true, createdAt: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
    },
};
//# sourceMappingURL=deviceTokens.service.js.map