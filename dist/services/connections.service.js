"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionsService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const notifications_service_1 = require("./notifications.service");
exports.connectionsService = {
    async sendRequest(senderId, receiverId) {
        if (senderId === receiverId)
            throw new ApiError_1.ApiError(400, 'Cannot connect with yourself');
        const existing = await database_1.prisma.connectionRequest.findUnique({
            where: { senderId_receiverId: { senderId, receiverId } },
        });
        if (existing) {
            if (existing.status === 'PENDING')
                throw new ApiError_1.ApiError(409, 'Connection request already sent');
            if (existing.status === 'ACCEPTED')
                throw new ApiError_1.ApiError(409, 'Already connected');
            // REJECTED — allow re-send by updating
            const updated = await database_1.prisma.connectionRequest.update({
                where: { id: existing.id },
                data: { status: 'PENDING', updatedAt: new Date() },
                include: { sender: { select: { id: true, displayName: true, avatarUrl: true, username: true } } },
            });
            await notifications_service_1.notificationsService.create({
                recipientId: receiverId,
                type: 'CONNECTION_REQUEST',
                actorId: senderId,
                entityId: updated.id,
                entityType: 'CONNECTION_REQUEST',
                body: `${updated.sender.displayName} sent you a connection request.`,
            });
            return updated;
        }
        // Also check reverse direction
        const reverse = await database_1.prisma.connectionRequest.findUnique({
            where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
        });
        if (reverse?.status === 'ACCEPTED')
            throw new ApiError_1.ApiError(409, 'Already connected');
        const request = await database_1.prisma.connectionRequest.create({
            data: { senderId, receiverId },
            include: { sender: { select: { id: true, displayName: true, avatarUrl: true, username: true } } },
        });
        await notifications_service_1.notificationsService.create({
            recipientId: receiverId,
            type: 'CONNECTION_REQUEST',
            actorId: senderId,
            entityId: request.id,
            entityType: 'CONNECTION_REQUEST',
            body: `${request.sender.displayName} sent you a connection request.`,
        });
        return request;
    },
    async acceptRequest(requestId, userId) {
        const request = await database_1.prisma.connectionRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new ApiError_1.ApiError(404, 'Request not found');
        if (request.receiverId !== userId)
            throw new ApiError_1.ApiError(403, 'Forbidden');
        if (request.status !== 'PENDING')
            throw new ApiError_1.ApiError(400, 'Request is not pending');
        const updated = await database_1.prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' },
            include: {
                sender: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
                receiver: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
            },
        });
        // Create mutual follow relationship (used as "connection")
        await database_1.prisma.$transaction([
            database_1.prisma.follow.upsert({
                where: { followerId_followingId: { followerId: request.senderId, followingId: request.receiverId } },
                create: { followerId: request.senderId, followingId: request.receiverId },
                update: {},
            }),
            database_1.prisma.follow.upsert({
                where: { followerId_followingId: { followerId: request.receiverId, followingId: request.senderId } },
                create: { followerId: request.receiverId, followingId: request.senderId },
                update: {},
            }),
        ]);
        // Delete the pending notification for this request
        await database_1.prisma.notification.deleteMany({
            where: {
                recipientId: userId,
                type: 'CONNECTION_REQUEST',
                entityId: requestId,
            },
        });
        // Notify sender that request was accepted
        await notifications_service_1.notificationsService.create({
            recipientId: request.senderId,
            type: 'CONNECTION_ACCEPTED',
            actorId: userId,
            entityId: requestId,
            entityType: 'CONNECTION_REQUEST',
            body: `${updated.receiver.displayName} accepted your connection request.`,
        });
        // Emit real-time event to both users for instant count refresh
        try {
            const { getIO } = await Promise.resolve().then(() => __importStar(require('../sockets/index')));
            const io = getIO();
            io.to(`user:${request.senderId}`).emit('connection:accepted', { requestId, userId });
            io.to(`user:${userId}`).emit('connection:accepted', { requestId, userId });
        }
        catch { /* socket may not be initialized in tests */ }
        return updated;
    },
    async rejectRequest(requestId, userId) {
        const request = await database_1.prisma.connectionRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new ApiError_1.ApiError(404, 'Request not found');
        if (request.receiverId !== userId)
            throw new ApiError_1.ApiError(403, 'Forbidden');
        if (request.status !== 'PENDING')
            throw new ApiError_1.ApiError(400, 'Request is not pending');
        await database_1.prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' },
        });
        // Remove the notification
        await database_1.prisma.notification.deleteMany({
            where: { recipientId: userId, type: 'CONNECTION_REQUEST', entityId: requestId },
        });
    },
    async getStatus(senderId, receiverId) {
        const req = await database_1.prisma.connectionRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });
        return req ?? null;
    },
    async getConnections(userId) {
        const accepted = await database_1.prisma.connectionRequest.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            include: {
                sender: { select: { id: true, displayName: true, avatarUrl: true, username: true, bio: true } },
                receiver: { select: { id: true, displayName: true, avatarUrl: true, username: true, bio: true } },
            },
        });
        return accepted.map((r) => (r.senderId === userId ? r.receiver : r.sender));
    },
    async getConnectionCount(userId) {
        return database_1.prisma.connectionRequest.count({
            where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
        });
    },
    async getPendingReceived(userId) {
        return database_1.prisma.connectionRequest.findMany({
            where: { receiverId: userId, status: 'PENDING' },
            include: {
                sender: { select: { id: true, displayName: true, avatarUrl: true, username: true, bio: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
};
//# sourceMappingURL=connections.service.js.map