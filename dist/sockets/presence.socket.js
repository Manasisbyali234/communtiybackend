"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPresenceHandlers = registerPresenceHandlers;
exports.isUserOnline = isUserOnline;
exports.getUserPresence = getUserPresence;
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const PRESENCE_TTL = 60; // seconds
async function notifyConversationParticipants(io, userId, event, lastSeenAt) {
    const participants = await database_1.prisma.conversationParticipant.findMany({
        where: { userId, leftAt: null },
        select: {
            conversation: {
                select: {
                    participants: { where: { userId: { not: userId }, leftAt: null }, select: { userId: true } },
                },
            },
        },
    });
    const recipientIds = new Set(participants.flatMap((participant) => participant.conversation.participants.map((other) => other.userId)));
    for (const recipientId of recipientIds) {
        io.to(`user:${recipientId}`).emit(event, { userId, lastSeenAt });
    }
}
function registerPresenceHandlers(io, socket) {
    const userId = socket.data['userId'];
    const setOnline = async () => {
        await redis_1.redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL);
        await notifyConversationParticipants(io, userId, 'presence:online');
    };
    const setOffline = async () => {
        const lastSeenAt = new Date().toISOString();
        await redis_1.redis.del(`presence:${userId}`);
        await redis_1.redis.set(`presence:last-seen:${userId}`, lastSeenAt);
        await notifyConversationParticipants(io, userId, 'presence:offline', lastSeenAt);
    };
    // Set online immediately on connect
    void setOnline().catch((err) => logger_1.logger.error({ err }, 'Presence online error'));
    // Heartbeat ping — resets TTL
    socket.on('presence:ping', () => {
        redis_1.redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL).catch((err) => logger_1.logger.error({ err }, 'Presence ping error'));
    });
    // Set offline on disconnect
    socket.on('disconnect', () => {
        void setOffline().catch((err) => logger_1.logger.error({ err }, 'Presence offline error'));
    });
}
async function isUserOnline(userId) {
    const result = await redis_1.redis.exists(`presence:${userId}`);
    return result === 1;
}
async function getUserPresence(userId) {
    const isOnline = await isUserOnline(userId);
    if (isOnline)
        return { isOnline: true, lastSeenAt: null };
    return {
        isOnline: false,
        lastSeenAt: await redis_1.redis.get(`presence:last-seen:${userId}`),
    };
}
//# sourceMappingURL=presence.socket.js.map