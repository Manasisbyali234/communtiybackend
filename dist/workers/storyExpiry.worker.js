"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyExpiryWorker = void 0;
const bullmq_1 = require("../config/bullmq");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
exports.storyExpiryWorker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.STORY_EXPIRY, async (job) => {
    const { storyId } = job.data;
    logger_1.logger.info({ storyId }, 'Processing story expiry');
    try {
        // In a real app, you might archive stories or keep them for memories.
        // For this implementation, we physically delete them to save space.
        await database_1.prisma.story.delete({
            where: { id: storyId },
        });
        logger_1.logger.info({ storyId }, 'Expired story deleted successfully');
    }
    catch (error) {
        if (error.code === 'P2025') {
            logger_1.logger.warn({ storyId }, 'Story already deleted or not found');
        }
        else {
            throw error;
        }
    }
});
//# sourceMappingURL=storyExpiry.worker.js.map