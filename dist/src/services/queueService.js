"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueJob = exports.analyticsQueue = exports.renderQueue = exports.aiGenerationQueue = exports.queuesEnabled = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
exports.queuesEnabled = Boolean(env_1.env.ENABLE_QUEUES && env_1.env.REDIS_URL);
let connection = null;
if (exports.queuesEnabled && env_1.env.REDIS_URL) {
    connection = new ioredis_1.default(env_1.env.REDIS_URL, { lazyConnect: true });
    connection.on("error", (error) => {
        logger_1.logger.error("Redis connection error", { error });
    });
    connection.connect().catch((error) => {
        logger_1.logger.error("Failed to connect to Redis", { error });
        connection?.disconnect();
        connection = null;
    });
}
else {
    logger_1.logger.info("BullMQ queues disabled. Set ENABLE_QUEUES=true and REDIS_URL to enable.");
}
const createQueue = (name) => {
    if (!connection) {
        logger_1.logger.debug(`Queue ${name} inactive; Redis connection unavailable.`);
        return null;
    }
    return new bullmq_1.Queue(name, { connection });
};
exports.aiGenerationQueue = createQueue("aiGeneration");
exports.renderQueue = createQueue("render");
exports.analyticsQueue = createQueue("analytics");
const queueMap = {
    aiGeneration: exports.aiGenerationQueue,
    render: exports.renderQueue,
    analytics: exports.analyticsQueue,
};
const enqueueJob = async (queueName, jobName, data) => {
    const queue = queueMap[queueName];
    if (!queue) {
        logger_1.logger.warn(`Skipping job ${jobName}; queue ${queueName} unavailable.`);
        return;
    }
    await queue.add(jobName, data, { removeOnComplete: true, removeOnFail: true });
};
exports.enqueueJob = enqueueJob;
//# sourceMappingURL=queueService.js.map