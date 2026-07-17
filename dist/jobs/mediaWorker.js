"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMediaWorker = startMediaWorker;
const bullmq_1 = require("../config/bullmq");
const logger_1 = require("../config/logger");
function startMediaWorker() {
    const worker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.MEDIA, async (job) => {
        const { key, purpose } = job.data;
        logger_1.logger.info({ jobName: job.name, key, purpose }, 'Processing media job');
        // Media files are now stored directly in PostgreSQL
        // No processing needed since files are stored as-is
        await new Promise((resolve) => setTimeout(resolve, 100));
        logger_1.logger.info({ key }, 'Media processing complete');
    });
    return worker;
}
//# sourceMappingURL=mediaWorker.js.map