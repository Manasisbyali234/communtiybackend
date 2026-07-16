"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorkers = startWorkers;
const logger_1 = require("../config/logger");
const bullmq_1 = require("../config/bullmq");
// Import workers to ensure they are instantiated and start listening
require("./scheduledPost.worker");
require("./storyExpiry.worker");
require("./analytics.worker");
// You can add more workers here, e.g., email, push notifications
async function scheduleCronJobs() {
    try {
        const analyticsQueue = (0, bullmq_1.getQueue)(bullmq_1.QUEUE_NAMES.ANALYTICS);
        // Add a daily analytics job (simplified - runs every 24 hours)
        await analyticsQueue.add('daily-analytics', {}, {
            delay: 24 * 60 * 60 * 1000, // 24 hours delay
        });
        logger_1.logger.info('Cron jobs scheduled successfully');
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Failed to schedule cron jobs');
    }
}
async function startWorkers() {
    logger_1.logger.info('Starting PostgreSQL-based workers...');
    await scheduleCronJobs();
}
// If this file is run directly (e.g. via a dedicated worker process in Docker)
if (require.main === module) {
    startWorkers().catch((err) => {
        logger_1.logger.fatal({ err }, 'Worker process crashed');
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map