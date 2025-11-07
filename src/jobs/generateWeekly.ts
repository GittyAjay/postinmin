import { Worker } from "bullmq";

import { env } from "../config/env";
import { generateCalendar } from "../services/calendarService";
import { logger } from "../utils/logger";

export const registerGenerateWeeklyWorker = () => {
  if (!env.REDIS_URL) {
    return null;
  }

  const worker = new Worker(
    "aiGeneration",
    async (job) => {
      const { businessId } = job.data as { businessId: string };
      logger.info(`Processing weekly generation job for business ${businessId}`);
      await generateCalendar({ businessId, startDate: new Date().toISOString(), days: 7, variants: 1 });
    },
    { connection: { url: env.REDIS_URL } }
  );

  worker.on("failed", (job, err) => {
    logger.error("aiGeneration job failed", { jobId: job?.id, error: err });
  });

  worker.on("error", (error) => {
    logger.error("aiGeneration worker encountered an error", { error });
  });

  return worker;
};

