"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWorkers = initWorkers;
const emailWorker_1 = require("./emailWorker");
const pushWorker_1 = require("./pushWorker");
const storyExpiryWorker_1 = require("./storyExpiryWorker");
const mediaWorker_1 = require("./mediaWorker");
const eventReminderWorker_1 = require("./eventReminderWorker");
const marketRatesSync_job_1 = require("./marketRatesSync.job");
const logger_1 = require("../config/logger");
function initWorkers() {
    logger_1.logger.info('Initializing BullMQ workers...');
    (0, emailWorker_1.startEmailWorker)();
    (0, pushWorker_1.startPushWorker)();
    (0, storyExpiryWorker_1.startStoryExpiryWorker)();
    (0, mediaWorker_1.startMediaWorker)();
    (0, eventReminderWorker_1.startEventReminderWorker)();
    (0, marketRatesSync_job_1.startMarketRatesSyncJob)();
    logger_1.logger.info('BullMQ workers initialized');
}
//# sourceMappingURL=index.js.map