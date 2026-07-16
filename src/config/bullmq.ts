import { prisma } from './database';
import { logger } from './logger';
import { cacheService } from '../services/cache.service';

// PostgreSQL-based job queue to replace BullMQ
export const QUEUE_NAMES = {
  EMAIL: 'email',
  PUSH: 'push',
  STORY_EXPIRY: 'story-expiry',
  EVENT_REMINDER: 'event-reminder',
  MEDIA: 'media',
  SCHEDULED_POST: 'scheduled-post',
  ANALYTICS: 'analytics',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

interface JobData {
  [key: string]: any;
}

interface Job {
  id: string;
  queue: string;
  name: string;
  data: JobData;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processAfter?: Date;
}

class SimpleQueue {
  constructor(private queueName: string) {}

  async add(jobName: string, data: JobData, options: { delay?: number; attempts?: number } = {}): Promise<void> {
    const { delay = 0, attempts = 3 } = options;
    const processAfter = delay > 0 ? new Date(Date.now() + delay) : new Date();

    const jobKey = `job:${this.queueName}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    await cacheService.set(jobKey, {
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
    const existingJobs = (await cacheService.get<string[]>(queueListKey)) || [];
    existingJobs.push(jobKey);
    await cacheService.set(queueListKey, existingJobs);

    logger.info({ queue: this.queueName, jobName, delay }, 'Job added to queue');
  }

  async process(callback: (job: { name: string; data: JobData }) => Promise<void>): Promise<void> {
    const queueListKey = `queue:${this.queueName}`;
    
    const processJobs = async () => {
      try {
        const jobKeys = (await cacheService.get<string[]>(queueListKey)) || [];
        const now = new Date();

        for (const jobKey of jobKeys) {
          const job = await cacheService.get<Job>(jobKey);
          if (!job) {
            // Remove invalid job key
            const updatedKeys = jobKeys.filter(k => k !== jobKey);
            await cacheService.set(queueListKey, updatedKeys);
            continue;
          }

          // Check if job should be processed
          if (job.processAfter && job.processAfter > now) {
            continue;
          }

          // Check if job has exceeded max attempts
          if (job.attempts >= job.maxAttempts) {
            logger.error({ jobId: job.id, attempts: job.attempts }, 'Job exceeded max attempts');
            await this.removeJob(jobKey);
            continue;
          }

          try {
            // Update attempts
            job.attempts++;
            await cacheService.set(jobKey, job);

            // Process the job
            await callback({ name: job.name, data: job.data });
            
            // Remove successful job
            await this.removeJob(jobKey);
            logger.info({ jobId: job.id, queue: this.queueName }, 'Job completed successfully');
          } catch (error) {
            logger.error({ error, jobId: job.id, attempts: job.attempts }, 'Job processing failed');
            
            if (job.attempts >= job.maxAttempts) {
              await this.removeJob(jobKey);
            } else {
              // Retry after delay
              job.processAfter = new Date(Date.now() + (job.attempts * 5000)); // Exponential backoff
              await cacheService.set(jobKey, job);
            }
          }
        }
      } catch (error) {
        logger.error({ error, queue: this.queueName }, 'Queue processing error');
      }
    };

    // Process jobs every 5 seconds
    setInterval(processJobs, 5000);
    
    // Initial processing
    processJobs();
    
    logger.info({ queue: this.queueName }, 'Queue processor started');
  }

  private async removeJob(jobKey: string): Promise<void> {
    const queueListKey = `queue:${this.queueName}`;
    const jobKeys = (await cacheService.get<string[]>(queueListKey)) || [];
    const updatedKeys = jobKeys.filter(k => k !== jobKey);
    
    await Promise.all([
      cacheService.set(queueListKey, updatedKeys),
      cacheService.delete(jobKey),
    ]);
  }
}

const queues = new Map<string, SimpleQueue>();

export function getQueue(name: QueueName): SimpleQueue {
  if (!queues.has(name)) {
    queues.set(name, new SimpleQueue(name));
  }
  return queues.get(name) as SimpleQueue;
}

// Simple worker replacement
export class Worker {
  constructor(private queueName: string, private processor: (job: any) => Promise<void>) {
    const queue = getQueue(queueName as QueueName);
    queue.process(this.processor);
  }
}

export const connection = null; // Not needed for PostgreSQL-based queue
