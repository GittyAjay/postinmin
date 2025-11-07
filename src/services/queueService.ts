import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "../config/env";
import { logger } from "../utils/logger";

export const queuesEnabled = Boolean(env.ENABLE_QUEUES && env.REDIS_URL);

let connection: IORedis | null = null;

if (queuesEnabled && env.REDIS_URL) {
  connection = new IORedis(env.REDIS_URL, { lazyConnect: true });
  connection.on("error", (error) => {
    logger.error("Redis connection error", { error });
  });
  connection.connect().catch((error) => {
    logger.error("Failed to connect to Redis", { error });
    connection?.disconnect();
    connection = null;
  });
} else {
  logger.info("BullMQ queues disabled. Set ENABLE_QUEUES=true and REDIS_URL to enable.");
}

const createQueue = (name: string) => {
  if (!connection) {
    logger.debug(`Queue ${name} inactive; Redis connection unavailable.`);
    return null;
  }
  return new Queue(name, { connection });
};

export const aiGenerationQueue = createQueue("aiGeneration");
export const renderQueue = createQueue("render");
export const analyticsQueue = createQueue("analytics");

export type QueueName = "aiGeneration" | "render" | "analytics";

const queueMap: Record<QueueName, Queue | null> = {
  aiGeneration: aiGenerationQueue,
  render: renderQueue,
  analytics: analyticsQueue,
};

export const enqueueJob = async <T>(queueName: QueueName, jobName: string, data: T) => {
  const queue = queueMap[queueName];
  if (!queue) {
    logger.warn(`Skipping job ${jobName}; queue ${queueName} unavailable.`);
    return;
  }
  await queue.add(jobName, data, { removeOnComplete: true, removeOnFail: true });
};

