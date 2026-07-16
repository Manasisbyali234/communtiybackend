import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { ReportReason, ReportStatus } from '@prisma/client';

export const moderationService = {
  async submitReport(reporterId: string, data: { postId?: string; reportedUserId?: string; reason: ReportReason; details?: string }) {
    if (!data.postId && !data.reportedUserId) {
      throw ApiError.badRequest('Must report either a post or a user');
    }
    return prisma.report.create({ data: { reporterId, ...data } });
  },

  async listReports(params: { status?: ReportStatus; skip?: number; take?: number }) {
    const { status, skip = 0, take = 20 } = params;
    return prisma.report.findMany({
      where: { ...(status ? { status } : {}) },
      include: {
        reporter: { select: { id: true, username: true } },
        reportedUser: { select: { id: true, username: true } },
        post: { select: { id: true, content: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  async updateReport(reportId: string, status: ReportStatus) {
    return prisma.report.update({ where: { id: reportId }, data: { status, reviewedAt: new Date() } });
  },

  async banUser(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async unbanUser(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  },

  async removePost(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound('Post not found');
    await prisma.post.delete({ where: { id: postId } });
  },
};
