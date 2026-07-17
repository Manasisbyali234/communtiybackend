import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export const deviceTokensService = {
  async register(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
    // Upsert — reassign token to this user if it was previously associated with another
    await prisma.deviceToken.deleteMany({ where: { token, userId: { not: userId } } });

    return prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  },

  async unregister(userId: string, tokenId: string) {
    const dt = await prisma.deviceToken.findFirst({ where: { id: tokenId, userId } });
    if (!dt) throw ApiError.notFound('Device token not found');
    await prisma.deviceToken.delete({ where: { id: tokenId } });
  },

  async getTokensForUser(userId: string): Promise<string[]> {
    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return tokens.map((t) => t.token);
  },

  async listDevices(userId: string) {
    return prisma.deviceToken.findMany({
      where: { userId },
      select: { id: true, platform: true, token: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  },
};
