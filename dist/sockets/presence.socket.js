"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPresenceHandlers = registerPresenceHandlers;
exports.isUserOnline = isUserOnline;
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const PRESENCE_TTL = 60; // seconds
function registerPresenceHandlers(io, socket) {
    const userId = socket.data['userId'];
    const setOnline = async () => {
        await redis_1.redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL);
        // Notify followers that this user came online
        const followers = await database_1.prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
        for (const f of followers) {
            io.to(`user:${f.followerId}`).emit('presence:online', { userId });
        }
    };
    const setOffline = async () => {
        await redis_1.redis.del(`presence:${userId}`);
        const followers = await database_1.prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
        for (const f of followers) {
            io.to(`user:${f.followerId}`).emit('presence:offline', { userId });
        }
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
//# sourceMappingURL=presence.socket.js.map