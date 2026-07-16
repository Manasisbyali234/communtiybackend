import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { StoryExpiryJobData } from '../types/index';
import { logger } from '../config/logger';

export function startStoryExpiryWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.STORY_EXPIRY,
    async (job: { name: string; data: StoryExpiryJobData }) => {
      const { storyId } = job.data;
      logger.info({ jobName: job.name, storyId }, 'Processing story expiry job');

      // Delete the story from DB
      await prisma.story.deleteMany({ where: { id: storyId } });

      // Clean up the cache key
      await redis.del(`story:${storyId}`);

      logger.info({ storyId }, 'Story expired and cleaned up');
    },
  );

  return worker;
}
