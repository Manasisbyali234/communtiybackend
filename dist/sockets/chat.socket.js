"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = registerChatHandlers;
const messages_service_1 = require("../services/messages.service");
const notifications_service_1 = require("../services/notifications.service");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
function registerChatHandlers(io, socket) {
    const userId = socket.data['userId'];
    // Join all user's conversation rooms on connect
    void (async () => {
        try {
            const participations = await database_1.prisma.conversationParticipant.findMany({
                where: { userId },
                select: { conversationId: true },
            });
            for (const p of participations) {
                await socket.join(`conv:${p.conversationId}`);
            }
        }
        catch (err) {
            logger_1.logger.error({ err, userId }, 'Failed to join conversation rooms on connect');
        }
    })();
    // Handle chat:send
    socket.on('chat:send', async (payload) => {
        try {
            const message = await messages_service_1.messagesService.sendMessage(payload.conversationId, userId, {
                ...(payload.content && { content: payload.content }),
                ...(payload.mediaUrl && { mediaUrl: payload.mediaUrl }),
                ...(payload.mediaType && { mediaType: payload.mediaType })
            });
            // Emit to all participants in the conversation room
            io.to(`conv:${payload.conversationId}`).emit('chat:message', { message });
            // Create notifications for other participants
            const participants = await database_1.prisma.conversationParticipant.findMany({
                where: { conversationId: payload.conversationId, userId: { not: userId } },
                include: { user: { select: { displayName: true, expoPushToken: true } } },
            });
            const sender = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
            for (const participant of participants) {
                await notifications_service_1.notificationsService.create({
                    recipientId: participant.userId,
                    type: 'MESSAGE',
                    actorId: userId,
                    entityId: payload.conversationId,
                    entityType: 'Conversation',
                    body: `${sender?.displayName ?? 'Someone'}: ${(payload.content ?? 'Sent a file').slice(0, 80)}`,
                });
                // Emit real-time notification
                io.to(`user:${participant.userId}`).emit('notification:new', {
                    type: 'MESSAGE',
                    actorId: userId,
                    body: `${sender?.displayName ?? 'Someone'}: ${(payload.content ?? 'Sent a file').slice(0, 80)}`,
                });
            }
        }
        catch (err) {
            logger_1.logger.error({ err, userId, payload }, 'chat:send error');
            socket.emit('chat:error', { message: 'Failed to send message' });
        }
    });
    // Handle chat:read
    socket.on('chat:read', async (payload) => {
        try {
            await messages_service_1.messagesService.markRead(payload.conversationId, userId);
            socket.to(`conv:${payload.conversationId}`).emit('chat:read', {
                conversationId: payload.conversationId,
                userId,
                readAt: new Date().toISOString(),
            });
        }
        catch (err) {
            logger_1.logger.error({ err }, 'chat:read error');
        }
    });
}
//# sourceMappingURL=chat.socket.js.map