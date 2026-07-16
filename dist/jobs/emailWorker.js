"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmailWorker = startEmailWorker;
const bullmq_1 = require("../config/bullmq");
const email_service_1 = require("../services/email.service");
const logger_1 = require("../config/logger");
function startEmailWorker() {
    const worker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.EMAIL, async (job) => {
        logger_1.logger.info({ jobName: job.name, to: job.data.to }, 'Processing email job');
        await email_service_1.emailService.send(job.data);
    });
    return worker;
}
//# sourceMappingURL=emailWorker.js.map