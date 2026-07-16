import { Worker, QUEUE_NAMES } from '../config/bullmq';
import { emailService } from '../services/email.service';
import { EmailJobData } from '../types/index';
import { logger } from '../config/logger';

export function startEmailWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job: { name: string; data: EmailJobData }) => {
      logger.info({ jobName: job.name, to: job.data.to }, 'Processing email job');
      await emailService.send(job.data);
    },
  );

  return worker;
}
