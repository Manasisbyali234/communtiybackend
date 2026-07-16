import { startEmailWorker } from './emailWorker';
import { startPushWorker } from './pushWorker';
import { startStoryExpiryWorker } from './storyExpiryWorker';
import { startMediaWorker } from './mediaWorker';
import { startEventReminderWorker } from './eventReminderWorker';
import { startMarketRatesSyncJob } from './marketRatesSync.job';
import { logger } from '../config/logger';

export function initWorkers(): void {
  logger.info('Initializing BullMQ workers...');
  startEmailWorker();
  startPushWorker();
  startStoryExpiryWorker();
  startMediaWorker();
  startEventReminderWorker();
  startMarketRatesSyncJob();
  logger.info('BullMQ workers initialized');
}
