"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPushWorker = startPushWorker;
const bullmq_1 = require("../config/bullmq");
const push_service_1 = require("../services/push.service");
const logger_1 = require("../config/logger");
function startPushWorker() {
    const worker = new bullmq_1.Worker(bullmq_1.QUEUE_NAMES.PUSH, async (job) => {
        const { expoPushToken, title, body, data } = job.data;
        logger_1.logger.info({ jobName: job.name, expoPushToken }, 'Processing push notification job');
        await push_service_1.pushService.send(expoPushToken, title, body, data);
    });
    return worker;
}
//# sourceMappingURL=pushWorker.js.map