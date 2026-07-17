"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsWorker = void 0;
const bullmq_1 = require("../config/bullmq");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
exports.analyticsWorker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.ANALYTICS, async (job) => {
    logger_1.logger.info({ jobName: job.name }, 'Processing daily analytics');
    // Calculate for the previous day
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [newUsers, newPosts, newComments, newMessages, newCommunities, activeUsers] = await Promise.all([
        database_1.prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        database_1.prisma.post.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        database_1.prisma.comment.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        database_1.prisma.message.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        database_1.prisma.community.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        // Active users could be approximated by distinct authors of posts/comments/messages/likes
        // For simplicity in this job, we query distinct users who created an audit log yesterday
        database_1.prisma.auditLog.groupBy({
            by: ['actorId'],
            where: { createdAt: { gte: yesterday, lt: today }, actorId: { not: '' } },
        }).then((res) => res.length),
    ]);
    await database_1.prisma.dailyStats.upsert({
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
    logger_1.logger.info({ date: yesterday }, 'Daily analytics processed successfully');
});
//# sourceMappingURL=analytics.worker.js.map