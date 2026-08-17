"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const notifications_service_1 = require("./notifications.service");
const presence_socket_1 = require("../sockets/presence.socket");
exports.messagesService = {
    async getConversations(userId) {
        const participations = await database_1.prisma.conversationParticipant.findMany({
            where: { userId, leftAt: null },
            include: {
                conversation: {
                    include: {
                        participants: {
                            where: { leftAt: null },
                            include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
                        },
                        messages: {
                            where: { deletedForAll: false },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
        // Exclude matrimony-only chats from the main chat screen
        const filtered = participations.filter((p) => !p.conversation.isMatrimonyChat);
        const conversations = await Promise.all(filtered.map(async (p) => {
            const participants = await Promise.all(p.conversation.participants.map(async (part) => ({
                ...part,
                user: part.userId === userId ? part.user : { ...part.user, ...(await (0, presence_socket_1.getUserPresence)(part.userId)) },
            })));
            const unreadCount = await database_1.prisma.message.count({
                where: {
                    conversationId: p.conversationId,
                    senderId: { not: userId },
                    deletedForAll: false,
                    ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
                },
            });
            return {
                ...p.conversation,
                participants,
                lastReadAt: p.lastReadAt,
                unreadCount,
                otherParticipants: participants
                    .filter((part) => part.userId !== userId)
                    .map((part) => part.user),
                lastMessage: p.conversation.messages[0] ?? null,
            };
        }));
        return conversations
            .sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
            return bTime - aTime;
        });
    },
    async getOrCreateConversation(userId, participantId) {
        if (userId === participantId)
            throw ApiError_1.ApiError.badRequest('Cannot start a conversation with yourself');
        const target = await database_1.prisma.user.findUnique({ where: { id: participantId } });
        if (!target)
            throw ApiError_1.ApiError.notFound('User not found');
        // Look for existing 1:1 conversation shared by both users
        const userConvIds = await database_1.prisma.conversationParticipant.findMany({
            where: { userId, leftAt: null },
            select: { conversationId: true },
        });
        const convIds = userConvIds.map((p) => p.conversationId);
        const existing = await database_1.prisma.conversation.findFirst({
            where: {
                id: { in: convIds },
                isGroup: false,
                participants: { some: { userId: participantId, leftAt: null } },
            },
            include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } } },
        });
        if (existing)
            return existing;
        return database_1.prisma.conversation.create({
            data: {
                participants: {
                    create: [{ userId }, { userId: participantId }],
                },
            },
            include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } } },
        });
    },
    async getMessages(conversationId, userId, cursor, limit = 30) {
        const participant = await database_1.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!participant)
            throw ApiError_1.ApiError.forbidden('Not a participant in this conversation');
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const messages = await database_1.prisma.message.findMany({
            ...args,
            where: {
                conversationId,
                deletedForAll: false,
                hiddenFrom: { none: { userId } },
            },
            include: {
                sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                reactions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(messages, limit);
    },
    async sendMessage(conversationId, senderId, data) {
        const participant = await database_1.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId, userId: senderId } },
        });
        if (!participant || participant.leftAt)
            throw ApiError_1.ApiError.forbidden('Not a participant in this conversation');
        const [message] = await database_1.prisma.$transaction([
            database_1.prisma.message.create({
                data: { conversationId, senderId, ...data, deliveredAt: new Date() },
                include: {
                    sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                    reactions: true,
                },
            }),
            database_1.prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
        ]);
        const otherParticipants = await database_1.prisma.conversationParticipant.findMany({
            where: { conversationId, userId: { not: senderId }, leftAt: null },
            select: { userId: true },
        });
        for (const p of otherParticipants) {
            await notifications_service_1.notificationsService.create({
                recipientId: p.userId,
                type: 'MESSAGE',
                actorId: senderId,
                entityId: message.id,
                entityType: 'Message',
                body: 'You have a new message.',
            });
        }
        return message;
    },
    async getUnreadCount(userId) {
        const participations = await database_1.prisma.conversationParticipant.findMany({
            where: { userId, leftAt: null },
            include: {
                conversation: {
                    include: {
                        messages: {
                            where: { deletedForAll: false, senderId: { not: userId } },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });
        let count = 0;
        for (const p of participations) {
            const unread = p.conversation.messages.filter((m) => !p.lastReadAt || m.createdAt > p.lastReadAt);
            count += unread.length;
        }
        return count;
    },
    async markRead(conversationId, userId) {
        await database_1.prisma.conversationParticipant.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { lastReadAt: new Date() },
        });
    },
    // ── Message Reactions ────────────────────────────────────────────────────────
    async addReaction(messageId, userId, emoji) {
        const message = await database_1.prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.deletedForAll)
            throw ApiError_1.ApiError.notFound('Message not found');
        // Verify participant
        const participant = await database_1.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId: message.conversationId, userId } },
        });
        if (!participant)
            throw ApiError_1.ApiError.forbidden('Not a participant in this conversation');
        await database_1.prisma.messageReaction.upsert({
            where: { messageId_userId_emoji: { messageId, userId, emoji } },
            create: { messageId, userId, emoji },
            update: {},
        });
        return database_1.prisma.messageReaction.findMany({ where: { messageId } });
    },
    async removeReaction(messageId, userId, emoji) {
        await database_1.prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
        return database_1.prisma.messageReaction.findMany({ where: { messageId } });
    },
    // ── Delete Messages ──────────────────────────────────────────────────────────
    async deleteForEveryone(messageId, senderId) {
        const message = await database_1.prisma.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw ApiError_1.ApiError.notFound('Message not found');
        if (message.senderId !== senderId)
            throw ApiError_1.ApiError.forbidden('Only the sender can delete for everyone');
        const FIVE_MINUTES = 5 * 60 * 1000;
        if (Date.now() - message.createdAt.getTime() > FIVE_MINUTES) {
            throw ApiError_1.ApiError.badRequest('Can only delete messages within 5 minutes of sending');
        }
        return database_1.prisma.message.update({
            where: { id: messageId },
            data: { deletedForAll: true, content: null, mediaUrl: null },
        });
    },
    async deleteForMe(messageId, userId) {
        const message = await database_1.prisma.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw ApiError_1.ApiError.notFound('Message not found');
        const participant = await database_1.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId: message.conversationId, userId } },
        });
        if (!participant)
            throw ApiError_1.ApiError.forbidden('Not a participant in this conversation');
        await database_1.prisma.messageHide.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { messageId, userId },
            update: {},
        });
    },
};
//# sourceMappingURL=messages.service.js.map