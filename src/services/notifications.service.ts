import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { NotificationPayload } from '../types/index';
import { getIO } from '../sockets/index';

export const notificationsService = {
  async create(payload: NotificationPayload): Promise<void> {
    // Deduplication: skip if same unread notification already exists
    if (payload.actorId && payload.entityId) {
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId: payload.recipientId,
          type: payload.type as NotificationType,
          actorId: payload.actorId,
          entityId: payload.entityId,
          isRead: false,
        },
      });
      if (existing) return;
    }

    const notification = await prisma.notification.create({
      data: {
        recipientId: payload.recipientId,
        type: payload.type as NotificationType,
        actorId: payload.actorId ?? null,
        entityId: payload.entityId ?? null,
        entityType: payload.entityType ?? null,
        body: payload.body,
      },
      include: {
        actor: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
      },
    });

    try {
      getIO().to(`user:${payload.recipientId}`).emit('notification:new', notification);
    } catch {
      // socket server may not be initialized in tests
    }
  },

  async list(userId: string, params: { cursor?: string; limit?: number; unreadOnly?: boolean }) {
    const { cursor, limit = 20, unreadOnly = false } = params;
    const args = buildCursorArgs({ cursor, limit });

    const notifications = await prisma.notification.findMany({
      ...args,
      where: { recipientId: userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
    });

    const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))] as string[];
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, displayName: true, avatarUrl: true, username: true },
        })
      : [];
    const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));

    const enriched = notifications.map((n) => ({
      ...n,
      actor: n.actorId ? (actorMap[n.actorId] ?? null) : null,
    }));

    return buildCursorPage(enriched, limit);
  },

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  },

  async markRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  },

  async delete(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { id: notificationId, recipientId: userId } });
  },
};
