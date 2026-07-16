import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { notificationsService } from './notifications.service';

export const connectionsService = {
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new ApiError(400, 'Cannot connect with yourself');

    const existing = await prisma.connectionRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });
    if (existing) {
      if (existing.status === 'PENDING') throw new ApiError(409, 'Connection request already sent');
      if (existing.status === 'ACCEPTED') throw new ApiError(409, 'Already connected');
      // REJECTED — allow re-send by updating
      const updated = await prisma.connectionRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING', updatedAt: new Date() },
        include: { sender: { select: { id: true, displayName: true, avatarUrl: true, username: true } } },
      });
      await notificationsService.create({
        recipientId: receiverId,
        type: 'CONNECTION_REQUEST',
        actorId: senderId,
        entityId: updated.id,
        entityType: 'CONNECTION_REQUEST',
        body: `${updated.sender.displayName} sent you a connection request.`,
      });
      return updated;
    }

    // Also check reverse direction
    const reverse = await prisma.connectionRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });
    if (reverse?.status === 'ACCEPTED') throw new ApiError(409, 'Already connected');

    const request = await prisma.connectionRequest.create({
      data: { senderId, receiverId },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true, username: true } } },
    });

    await notificationsService.create({
      recipientId: receiverId,
      type: 'CONNECTION_REQUEST',
      actorId: senderId,
      entityId: request.id,
      entityType: 'CONNECTION_REQUEST',
      body: `${request.sender.displayName} sent you a connection request.`,
    });

    return request;
  },

  async acceptRequest(requestId: string, userId: string) {
    const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ApiError(404, 'Request not found');
    if (request.receiverId !== userId) throw new ApiError(403, 'Forbidden');
    if (request.status !== 'PENDING') throw new ApiError(400, 'Request is not pending');

    const updated = await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
      },
    });

    // Create mutual follow relationship (used as "connection")
    await prisma.$transaction([
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: request.senderId, followingId: request.receiverId } },
        create: { followerId: request.senderId, followingId: request.receiverId },
        update: {},
      }),
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: request.receiverId, followingId: request.senderId } },
        create: { followerId: request.receiverId, followingId: request.senderId },
        update: {},
      }),
    ]);

    // Delete the pending notification for this request
    await prisma.notification.deleteMany({
      where: {
        recipientId: userId,
        type: 'CONNECTION_REQUEST',
        entityId: requestId,
      },
    });

    // Notify sender that request was accepted
    await notificationsService.create({
      recipientId: request.senderId,
      type: 'CONNECTION_ACCEPTED',
      actorId: userId,
      entityId: requestId,
      entityType: 'CONNECTION_REQUEST',
      body: `${updated.receiver.displayName} accepted your connection request.`,
    });

    // Emit real-time event to both users for instant count refresh
    try {
      const { getIO } = await import('../sockets/index');
      const io = getIO();
      io.to(`user:${request.senderId}`).emit('connection:accepted', { requestId, userId });
      io.to(`user:${userId}`).emit('connection:accepted', { requestId, userId });
    } catch { /* socket may not be initialized in tests */ }

    return updated;
  },

  async rejectRequest(requestId: string, userId: string) {
    const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ApiError(404, 'Request not found');
    if (request.receiverId !== userId) throw new ApiError(403, 'Forbidden');
    if (request.status !== 'PENDING') throw new ApiError(400, 'Request is not pending');

    await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    // Remove the notification
    await prisma.notification.deleteMany({
      where: { recipientId: userId, type: 'CONNECTION_REQUEST', entityId: requestId },
    });
  },

  async getStatus(senderId: string, receiverId: string) {
    const req = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    return req ?? null;
  },

  async getConnections(userId: string) {
    const accepted = await prisma.connectionRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, username: true, bio: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true, username: true, bio: true } },
      },
    });

    return accepted.map((r) => (r.senderId === userId ? r.receiver : r.sender));
  },

  async getConnectionCount(userId: string) {
    return prisma.connectionRequest.count({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
    });
  },

  async getPendingReceived(userId: string) {
    return prisma.connectionRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true, username: true, bio: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
