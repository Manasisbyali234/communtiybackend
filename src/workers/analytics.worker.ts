import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export const analyticsWorker = new Worker(
  QUEUE_NAMES.ANALYTICS,
  async (job: { name: string; data: any }) => {
    logger.info({ jobName: job.name }, 'Processing daily analytics');

    // Calculate for the previous day
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [newUsers, newPosts, newComments, newMessages, newCommunities, activeUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.post.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.comment.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.message.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.community.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      // Active users could be approximated by distinct authors of posts/comments/messages/likes
      // For simplicity in this job, we query distinct users who created an audit log yesterday
      prisma.auditLog.groupBy({
        by: ['actorId'],
        where: { createdAt: { gte: yesterday, lt: today }, actorId: { not: '' } },
      }).then((res) => res.length),
    ]);

    await prisma.dailyStats.upsert({
      where: { date: yesterday },
      create: {
        date: yesterday,
        newUsers,
        newPosts,
        newComments,
        newMessages,
        newCommunities,
        activeUsers,
      },
      update: {
        newUsers,
        newPosts,
        newComments,
        newMessages,
        newCommunities,
        activeUsers,
      },
    });

    logger.info({ date: yesterday }, 'Daily analytics processed successfully');
  },
);
