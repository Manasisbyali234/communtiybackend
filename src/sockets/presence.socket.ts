import { Server, Socket } from 'socket.io';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const PRESENCE_TTL = 60; // seconds

export type UserPresence = {
  isOnline: boolean;
  lastSeenAt: string | null;
};

async function notifyConversationParticipants(io: Server, userId: string, event: 'presence:online' | 'presence:offline', lastSeenAt?: string) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId, leftAt: null },
    select: {
      conversation: {
        select: {
          participants: { where: { userId: { not: userId }, leftAt: null }, select: { userId: true } },
        },
      },
    },
  });

  const recipientIds = new Set(
    participants.flatMap((participant) => participant.conversation.participants.map((other) => other.userId)),
  );
  for (const recipientId of recipientIds) {
    io.to(`user:${recipientId}`).emit(event, { userId, lastSeenAt });
  }
}

export function registerPresenceHandlers(io: Server, socket: Socket): void {
  const userId = socket.data['userId'] as string;

  const setOnline = async () => {
    await redis.set(`presence:${userId}`, '1', 'EX', PRESENCE_TTL);
    await notifyConversationParticipants(io, userId, 'presence:online');
  };

  const setOffline = async () => {
    const lastSeenAt = new Date().toISOString();
    await redis.del(`presence:${userId}`);
    await redis.set(`presence:last-seen:${userId}`, lastSeenAt);
    await notifyConversationParticipants(io, userId, 'presence:offline', lastSeenAt);
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

export async function getUserPresence(userId: string): Promise<UserPresence> {
  const isOnline = await isUserOnline(userId);
  if (isOnline) return { isOnline: true, lastSeenAt: null };

  return {
    isOnline: false,
    lastSeenAt: await redis.get(`presence:last-seen:${userId}`),
  };
}
