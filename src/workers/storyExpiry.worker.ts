import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export const storyExpiryWorker = new Worker(
  QUEUE_NAMES.STORY_EXPIRY,
  async (job: { name: string; data: { storyId: string } }) => {
    const { storyId } = job.data;
    logger.info({ storyId }, 'Processing story expiry');

    try {
      // In a real app, you might archive stories or keep them for memories.
      // For this implementation, we physically delete them to save space.
      await prisma.story.delete({
        where: { id: storyId },
      });
      logger.info({ storyId }, 'Expired story deleted successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        logger.warn({ storyId }, 'Story already deleted or not found');
      } else {
        throw error;
      }
    }
  },
);
