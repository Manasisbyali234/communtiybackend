"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStoryExpiryWorker = startStoryExpiryWorker;
const bullmq_1 = require("../config/bullmq");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
function startStoryExpiryWorker() {
    const worker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.STORY_EXPIRY, async (job) => {
        const { storyId } = job.data;
        logger_1.logger.info({ jobName: job.name, storyId }, 'Processing story expiry job');
        // Delete the story from DB
        await database_1.prisma.story.deleteMany({ where: { id: storyId } });
        // Clean up the cache key
        await redis_1.redis.del(`story:${storyId}`);
        logger_1.logger.info({ storyId }, 'Story expired and cleaned up');
    });
    return worker;
}
//# sourceMappingURL=storyExpiryWorker.js.map