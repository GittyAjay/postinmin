import { env } from "../config/env";
import { registerGenerateWeeklyWorker } from "../jobs/generateWeekly";
import { registerRenderWorker } from "../jobs/renderWorker";
import { queuesEnabled } from "../services/queueService";
import { logger } from "../utils/logger";

export const startWorkers = () => {
  if (!queuesEnabled) {
    logger.warn("BullMQ workers disabled; set ENABLE_QUEUES=true and provide REDIS_URL to enable.");
    return;
  }

  registerGenerateWeeklyWorker();
  registerRenderWorker();
};

