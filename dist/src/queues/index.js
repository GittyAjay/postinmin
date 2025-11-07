"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorkers = void 0;
const generateWeekly_1 = require("../jobs/generateWeekly");
const renderWorker_1 = require("../jobs/renderWorker");
const queueService_1 = require("../services/queueService");
const logger_1 = require("../utils/logger");
const startWorkers = () => {
    if (!queueService_1.queuesEnabled) {
        logger_1.logger.warn("BullMQ workers disabled; set ENABLE_QUEUES=true and provide REDIS_URL to enable.");
        return;
    }
    (0, generateWeekly_1.registerGenerateWeeklyWorker)();
    (0, renderWorker_1.registerRenderWorker)();
};
exports.startWorkers = startWorkers;
//# sourceMappingURL=index.js.map