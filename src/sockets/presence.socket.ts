import { Server, Socket } from 'socket.io';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const PRESENCE_TTL = 60; // seconds

export function registerPresenceHandlers(io: Server, socket: Socket): void {
  const userId = socket.data['userId'] as string;

  const setOnline = async () => {
    await redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL);
    // Notify followers that this user came online
    const followers = await prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
    for (const f of followers) {
      io.to(`user:${f.followerId}`).emit('presence:online', { userId });
    }
  };

  const setOffline = async () => {
    await redis.del(`presence:${userId}`);
    const followers = await prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
    for (const f of followers) {
      io.to(`user:${f.followerId}`).emit('presence:offline', { userId });
    }
  };

  // Set online immediately on connect
  void setOnline().catch((err) => logger.error({ err }, 'Presence online error'));

  // Heartbeat ping — resets TTL
  socket.on('presence:ping', () => {
    redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL).catch((err) => logger.error({ err }, 'Presence ping error'));
  });

  // Set offline on disconnect
  socket.on('disconnect', () => {
    void setOffline().catch((err) => logger.error({ err }, 'Presence offline error'));
  });
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const result = await redis.exists(`presence:${userId}`);
  return result === 1;
}
