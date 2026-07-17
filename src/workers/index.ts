import { logger } from '../config/logger';
import { getQueue, QUEUE_NAMES } from '../config/bullmq';

// Import workers to ensure they are instantiated and start listening
import './scheduledPost.worker';
import './storyExpiry.worker';
import './analytics.worker';

// You can add more workers here, e.g., email, push notifications

async function scheduleCronJobs() {
  try {
    const analyticsQueue = getQueue(QUEUE_NAMES.ANALYTICS);
    
    // Add a daily analytics job (simplified - runs every 24 hours)
    await analyticsQueue.add(
      'daily-analytics',
      {},
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours delay
      }
    );
    
    logger.info('Cron jobs scheduled successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to schedule cron jobs');
  }
}

export async function startWorkers() {
  logger.info('Starting PostgreSQL-based workers...');
  await scheduleCronJobs();
}

// If this file is run directly (e.g. via a dedicated worker process in Docker)
if (require.main === module) {
  startWorkers().catch((err) => {
    logger.fatal({ err }, 'Worker process crashed');
    process.exit(1);
  });
}
