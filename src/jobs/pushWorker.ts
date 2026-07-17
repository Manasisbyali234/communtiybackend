import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { pushService } from '../services/push.service';
import { PushJobData } from '../types/index';
import { logger } from '../config/logger';

export function startPushWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.PUSH,
    async (job: { name: string; data: PushJobData }) => {
      const { expoPushToken, title, body, data } = job.data;
      logger.info({ jobName: job.name, expoPushToken }, 'Processing push notification job');
      await pushService.send(expoPushToken, title, body, data);
    },
  );

  return worker;
}
