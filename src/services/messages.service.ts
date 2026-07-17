import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { MediaType } from '@prisma/client';
import { notificationsService } from './notifications.service';
export const messagesService = {
  async getConversations(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
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
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    return participations.map((p) => ({
      ...p.conversation,
      lastReadAt: p.lastReadAt,
      otherParticipants: p.conversation.participants
        .filter((part) => part.userId !== userId)
        .map((part) => part.user),
      lastMessage: p.conversation.messages[0] ?? null,
    }));
  },

  async getOrCreateConversation(userId: string, participantId: string) {
    if (userId === participantId) throw ApiError.badRequest('Cannot start a conversation with yourself');

    const target = await prisma.user.findUnique({ where: { id: participantId } });
    if (!target) throw ApiError.notFound('User not found');

    // Look for existing 1:1 conversation (exactly 2 participants)
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT c.id FROM "Conversation" c
      WHERE c."isGroup" = false
        AND (
          SELECT COUNT(*) FROM "ConversationParticipant" cp WHERE cp."conversationId" = c.id
        ) = 2
        AND EXISTS (SELECT 1 FROM "ConversationParticipant" cp WHERE cp."conversationId" = c.id AND cp."userId" = ${userId})
        AND EXISTS (SELECT 1 FROM "ConversationParticipant" cp WHERE cp."conversationId" = c.id AND cp."userId" = ${participantId})
      LIMIT 1
    `;

    if (existing.length > 0) {
      return prisma.conversation.findUniqueOrThrow({
        where: { id: existing[0].id },
        include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } } },
      });
    }

    return prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: participantId }],
        },
      },
      include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } } },
    });
  },

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw ApiError.forbidden('Not a participant in this conversation');

    const args = buildCursorArgs({ cursor, limit });
    const messages = await prisma.message.findMany({
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

    return buildCursorPage(messages, limit);
  },

  async sendMessage(conversationId: string, senderId: string, data: { content?: string; mediaUrl?: string; mediaType?: MediaType }) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant || participant.leftAt) throw ApiError.forbidden('Not a participant in this conversation');

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, senderId, ...data, deliveredAt: new Date() },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          reactions: true,
        },
      }),
      prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
    ]);

    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId }, leftAt: null },
      select: { userId: true },
    });

    for (const p of otherParticipants) {
      await notificationsService.create({
        recipientId: p.userId,
        type: 'MESSAGE',
        actorId: senderId,
        entityId: message.id,
        entityType: 'Message',
      });
    }

    return message;
  },

  async markRead(conversationId: string, userId: string) {
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  },

  // ── Message Reactions ────────────────────────────────────────────────────────
  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedForAll) throw ApiError.notFound('Message not found');

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: message.conversationId, userId } },
    });
    if (!participant) throw ApiError.forbidden('Not a participant in this conversation');

    await prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });

    return prisma.messageReaction.findMany({ where: { messageId } });
  },

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
    return prisma.messageReaction.findMany({ where: { messageId } });
  },

  // ── Delete Messages ──────────────────────────────────────────────────────────
  async deleteForEveryone(messageId: string, senderId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw ApiError.notFound('Message not found');
    if (message.senderId !== senderId) throw ApiError.forbidden('Only the sender can delete for everyone');

    const FIVE_MINUTES = 5 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > FIVE_MINUTES) {
      throw ApiError.badRequest('Can only delete messages within 5 minutes of sending');
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { deletedForAll: true, content: null, mediaUrl: null },
    });
  },

  async deleteForMe(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw ApiError.notFound('Message not found');

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: message.conversationId, userId } },
    });
    if (!participant) throw ApiError.forbidden('Not a participant in this conversation');

    await prisma.messageHide.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: {},
    });
  },
};
