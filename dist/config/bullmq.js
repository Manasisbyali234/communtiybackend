"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.Worker = exports.QUEUE_NAMES = void 0;
exports.getQueue = getQueue;
const logger_1 = require("./logger");
const cache_service_1 = require("../services/cache.service");
// PostgreSQL-based job queue to replace BullMQ
exports.QUEUE_NAMES = {
    EMAIL: 'email',
    PUSH: 'push',
    STORY_EXPIRY: 'story-expiry',
    EVENT_REMINDER: 'event-reminder',
    MEDIA: 'media',
    SCHEDULED_POST: 'scheduled-post',
    ANALYTICS: 'analytics',
};
class SimpleQueue {
    queueName;
    constructor(queueName) {
        this.queueName = queueName;
    }
    async add(jobName, data, options = {}) {
        const { delay = 0, attempts = 3 } = options;
        const processAfter = delay > 0 ? new Date(Date.now() + delay) : new Date();
        const jobKey = `job:${this.queueName}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        await cache_service_1.cacheService.set(jobKey, {
            id: jobKey,
            queue: this.queueName,
            name: jobName,
            data,
            attempts: 0,
            maxAttempts: attempts,
            createdAt: new Date(),
            processAfter,
        });
        // Add to queue list
        const queueListKey = `queue:${this.queueName}`;
        const existingJobs = (await cache_service_1.cacheService.get(queueListKey)) || [];
        existingJobs.push(jobKey);
        await cache_service_1.cacheService.set(queueListKey, existingJobs);
        logger_1.logger.info({ queue: this.queueName, jobName, delay }, 'Job added to queue');
    }
    async process(callback) {
        const queueListKey = `queue:${this.queueName}`;
        const processJobs = async () => {
            try {
                const jobKeys = (await cache_service_1.cacheService.get(queueListKey)) || [];
                const now = new Date();
                for (const jobKey of jobKeys) {
                    const job = await cache_service_1.cacheService.get(jobKey);
                    if (!job) {
                        // Remove invalid job key
                        const updatedKeys = jobKeys.filter(k => k !== jobKey);
                        await cache_service_1.cacheService.set(queueListKey, updatedKeys);
                        continue;
                    }
                    // Check if job should be processed
                    if (job.processAfter && job.processAfter > now) {
                        continue;
                    }
                    // Check if job has exceeded max attempts
                    if (job.attempts >= job.maxAttempts) {
                        logger_1.logger.error({ jobId: job.id, attempts: job.attempts }, 'Job exceeded max attempts');
                        await this.removeJob(jobKey);
                        continue;
                    }
                    try {
                        // Update attempts
                        job.attempts++;
                        await cache_service_1.cacheService.set(jobKey, job);
                        // Process the job
                        await callback({ name: job.name, data: job.data });
                        // Remove successful job
                        await this.removeJob(jobKey);
                        logger_1.logger.info({ jobId: job.id, queue: this.queueName }, 'Job completed successfully');
                    }
                    catch (error) {
                        logger_1.logger.error({ error, jobId: job.id, attempts: job.attempts }, 'Job processing failed');
                        if (job.attempts >= job.maxAttempts) {
                            await this.removeJob(jobKey);
                        }
                        else {
                            // Retry after delay
                            job.processAfter = new Date(Date.now() + (job.attempts * 5000)); // Exponential backoff
                            await cache_service_1.cacheService.set(jobKey, job);
                        }
                    }
                }
            }
            catch (error) {
                logger_1.logger.error({ error, queue: this.queueName }, 'Queue processing error');
            }
        };
        // Process jobs every 5 seconds
        setInterval(processJobs, 5000);
        // Initial processing
        processJobs();
        logger_1.logger.info({ queue: this.queueName }, 'Queue processor started');
    }
    async removeJob(jobKey) {
        const queueListKey = `queue:${this.queueName}`;
        const jobKeys = (await cache_service_1.cacheService.get(queueListKey)) || [];
        const updatedKeys = jobKeys.filter(k => k !== jobKey);
        await Promise.all([
            cache_service_1.cacheService.set(queueListKey, updatedKeys),
            cache_service_1.cacheService.delete(jobKey),
        ]);
    }
}
const queues = new Map();
function getQueue(name) {
    if (!queues.has(name)) {
        queues.set(name, new SimpleQueue(name));
    }
    return queues.get(name);
}
// Simple worker replacement
class Worker {
    queueName;
    processor;
    constructor(queueName, processor) {
        this.queueName = queueName;
        this.processor = processor;
        const queue = getQueue(queueName);
        queue.process(this.processor);
    }
}
exports.Worker = Worker;
exports.connection = null; // Not needed for PostgreSQL-based queue
//# sourceMappingURL=bullmq.js.map