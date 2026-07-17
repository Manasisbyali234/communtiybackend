import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { MediaJobData } from '../types/index';
import { logger } from '../config/logger';

export function startMediaWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.MEDIA,
    async (job: { name: string; data: MediaJobData }) => {
      const { key, purpose } = job.data;
      logger.info({ jobName: job.name, key, purpose }, 'Processing media job');
      
      // Media files are now stored directly in PostgreSQL
      // No processing needed since files are stored as-is
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      logger.info({ key }, 'Media processing complete');
    },
  );

  return worker;
}
