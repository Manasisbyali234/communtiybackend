"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledPostWorker = void 0;
const bullmq_1 = require("../config/bullmq");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
// Helper to extract hashtags from content
function extractHashtags(content) {
    const regex = /#[\w\u0590-\u05ff]+/g;
    const matches = content.match(regex);
    if (!matches)
        return [];
    return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}
async function syncHashtags(postId, content) {
    const tags = extractHashtags(content);
    if (!tags.length)
        return;
    for (const tag of tags) {
        let hashtag = await database_1.prisma.hashtag.findUnique({ where: { name: tag } });
        if (!hashtag) {
            hashtag = await database_1.prisma.hashtag.create({ data: { name: tag } });
        }
        else {
            await database_1.prisma.hashtag.update({
                where: { id: hashtag.id },
                data: { postsCount: { increment: 1 } },
            });
        }
        await database_1.prisma.postHashtag.create({
            data: { postId, hashtagId: hashtag.id },
        });
    }
}
exports.scheduledPostWorker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.SCHEDULED_POST, async (job) => {
    const { postId } = job.data;
    logger_1.logger.info({ postId }, 'Processing scheduled post');
    const post = await database_1.prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
    if (!post) {
        logger_1.logger.warn({ postId }, 'Scheduled post not found or deleted, skipping');
        return;
    }
    if (!post.scheduledAt) {
        logger_1.logger.info({ postId }, 'Post already published, skipping');
        return;
    }
    await database_1.prisma.post.update({
        where: { id: postId },
        data: { scheduledAt: null, createdAt: new Date() }, // update createdAt to now so it bumps in feed
    });
    await syncHashtags(postId, post.content);
    logger_1.logger.info({ postId }, 'Scheduled post published successfully');
});
//# sourceMappingURL=scheduledPost.worker.js.map