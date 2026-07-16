import { Server, Socket } from 'socket.io';
import { messagesService } from '../services/messages.service';
import { notificationsService } from '../services/notifications.service';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { MediaType } from '@prisma/client';

interface SendMessagePayload {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

interface ReadPayload {
  conversationId: string;
}

export function registerChatHandlers(io: Server, socket: Socket): void {
  const userId = socket.data['userId'] as string;

  // Join all user's conversation rooms on connect
  void (async () => {
    try {
      const participations = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });
      for (const p of participations) {
        await socket.join(`conv:${p.conversationId}`);
      }
    } catch (err) {
      logger.error({ err, userId }, 'Failed to join conversation rooms on connect');
    }
  })();

  // Handle chat:send
  socket.on('chat:send', async (payload: SendMessagePayload) => {
    try {
      const message = await messagesService.sendMessage(
        payload.conversationId,
        userId,
        { 
          ...(payload.content && { content: payload.content }), 
          ...(payload.mediaUrl && { mediaUrl: payload.mediaUrl }), 
          ...(payload.mediaType && { mediaType: payload.mediaType }) 
        },
      );

      // Emit to all participants in the conversation room
      io.to(`conv:${payload.conversationId}`).emit('chat:message', { message });

      // Create notifications for other participants
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: payload.conversationId, userId: { not: userId } },
        include: { user: { select: { displayName: true, expoPushToken: true } } },
      });

      const sender = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });

      for (const participant of participants) {
        await notificationsService.create({
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
    } catch (err) {
      logger.error({ err, userId, payload }, 'chat:send error');
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Handle chat:read
  socket.on('chat:read', async (payload: ReadPayload) => {
    try {
      await messagesService.markRead(payload.conversationId, userId);
      socket.to(`conv:${payload.conversationId}`).emit('chat:read', {
        conversationId: payload.conversationId,
        userId,
        readAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'chat:read error');
    }
  });
}
