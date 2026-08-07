import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { MediaType } from '@prisma/client';
import { notificationsService } from './notifications.service';
import { getUserPresence } from '../sockets/presence.socket';

/** Throws 403 unless an ACCEPTED MatrimonyInterest exists between the two users (in either direction). */
async function _assertMatrimonyAccepted(userIdA: string, userIdB: string) {
  const profileA = await prisma.matrimonyProfile.findUnique({ where: { userId: userIdA }, select: { id: true } });
  const profileB = await prisma.matrimonyProfile.findUnique({ where: { userId: userIdB }, select: { id: true } });
  if (!profileA || !profileB) {
    throw new ApiError(403, 'Chat is only available between users with an accepted matrimony interest');
  }
  const accepted = await prisma.matrimonyInterest.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { fromProfileId: profileA.id, toProfileId: profileB.id },
        { fromProfileId: profileB.id, toProfileId: profileA.id },
      ],
    },
    select: { id: true },
  });
  if (!accepted) {
    throw new ApiError(403, 'Chat is only available between users with an accepted matrimony interest');
  }
}

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
    });

    const conversations = await Promise.all(participations.map(async (p) => {
      const participants = await Promise.all(p.conversation.participants.map(async (part) => ({
        ...part,
        user: part.userId === userId ? part.user : { ...part.user, ...(await getUserPresence(part.userId)) },
      })));

      const unreadCount = await prisma.message.count({
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

  async getOrCreateConversation(userId: string, participantId: string) {
    if (userId === participantId) throw ApiError.badRequest('Cannot start a conversation with yourself');

    const target = await prisma.user.findUnique({ where: { id: participantId } });
    if (!target) throw ApiError.notFound('User not found');

    // Enforce matrimony interest acceptance before allowing chat
    await _assertMatrimonyAccepted(userId, participantId);

    // Look for existing 1:1 conversation shared by both users
    const userConvIds = await prisma.conversationParticipant.findMany({
      where: { userId, leftAt: null },
      select: { conversationId: true },
    });
    const convIds = userConvIds.map((p) => p.conversationId);

    const existing = await prisma.conversation.findFirst({
      where: {
        id: { in: convIds },
        isGroup: false,
        participants: { some: { userId: participantId, leftAt: null } },
      },
      include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } } },
    });

    if (existing) return existing;

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
      include: { conversation: { include: { participants: { select: { userId: true } } } } },
    });
    if (!participant || participant.leftAt) throw ApiError.forbidden('Not a participant in this conversation');

    // Enforce matrimony interest acceptance for every message sent
    const otherUserId = (participant as any).conversation?.participants
      ?.find((p: any) => p.userId !== senderId)?.userId;
    if (otherUserId) await _assertMatrimonyAccepted(senderId, otherUserId);

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
        body: 'You have a new message.',
      });
    }

    return message;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const participations = await prisma.conversationParticipant.findMany({
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
      const unread = p.conversation.messages.filter(
        (m) => !p.lastReadAt || m.createdAt > p.lastReadAt
      );
      count += unread.length;
    }
    return count;
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
