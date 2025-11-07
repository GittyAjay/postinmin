"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGenerateWeeklyWorker = void 0;
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const calendarService_1 = require("../services/calendarService");
const logger_1 = require("../utils/logger");
const registerGenerateWeeklyWorker = () => {
    if (!env_1.env.REDIS_URL) {
        return null;
    }
    const worker = new bullmq_1.Worker("aiGeneration", async (job) => {
        const { businessId } = job.data;
        logger_1.logger.info(`Processing weekly generation job for business ${businessId}`);
        await (0, calendarService_1.generateCalendar)({ businessId, startDate: new Date().toISOString(), days: 7, variants: 1 });
    }, { connection: { url: env_1.env.REDIS_URL } });
    worker.on("failed", (job, err) => {
        logger_1.logger.error("aiGeneration job failed", { jobId: job?.id, error: err });
    });
    worker.on("error", (error) => {
        logger_1.logger.error("aiGeneration worker encountered an error", { error });
    });
    return worker;
};
exports.registerGenerateWeeklyWorker = registerGenerateWeeklyWorker;
//# sourceMappingURL=generateWeekly.js.map