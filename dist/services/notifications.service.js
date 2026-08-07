"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = void 0;
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const index_1 = require("../sockets/index");
exports.notificationsService = {
    async create(payload) {
        // Deduplication: skip if same unread notification already exists
        if (payload.actorId && payload.entityId) {
            const existing = await database_1.prisma.notification.findFirst({
                where: {
                    recipientId: payload.recipientId,
                    type: payload.type,
                    actorId: payload.actorId,
                    entityId: payload.entityId,
                    isRead: false,
                },
            });
            if (existing)
                return;
        }
        const notification = await database_1.prisma.notification.create({
            data: {
                recipientId: payload.recipientId,
                type: payload.type,
                actorId: payload.actorId ?? null,
                entityId: payload.entityId ?? null,
                entityType: payload.entityType ?? null,
                body: payload.body,
            },
            include: {
                actor: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
            },
        });
        try {
            (0, index_1.getIO)().to(`user:${payload.recipientId}`).emit('notification:new', notification);
        }
        catch {
            // socket server may not be initialized in tests
        }
    },
    async list(userId, params) {
        const { cursor, limit = 20, unreadOnly = false } = params;
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const notifications = await database_1.prisma.notification.findMany({
            ...args,
            where: { recipientId: userId, ...(unreadOnly ? { isRead: false } : {}) },
            orderBy: { createdAt: 'desc' },
        });
        const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))];
        const actors = actorIds.length
            ? await database_1.prisma.user.findMany({
                where: { id: { in: actorIds } },
                select: { id: true, displayName: true, avatarUrl: true, username: true },
            })
            : [];
        const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));
        const enriched = notifications.map((n) => ({
            ...n,
            actor: n.actorId ? (actorMap[n.actorId] ?? null) : null,
        }));
        return (0, pagination_1.buildCursorPage)(enriched, limit);
    },
    async unreadCount(userId) {
        return database_1.prisma.notification.count({ where: { recipientId: userId, isRead: false } });
    },
    async markRead(notificationId, userId) {
        await database_1.prisma.notification.updateMany({
            where: { id: notificationId, recipientId: userId },
            data: { isRead: true },
        });
    },
    async markAllRead(userId) {
        await database_1.prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true },
        });
    },
    async delete(notificationId, userId) {
        await database_1.prisma.notification.deleteMany({ where: { id: notificationId, recipientId: userId } });
    },
};
//# sourceMappingURL=notifications.service.js.map