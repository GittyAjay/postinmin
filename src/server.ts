import app from "./app";
import { env } from "./config/env";
import { startWorkers } from "./queues";
import { logger } from "./utils/logger";

const port = env.PORT;

const server = app.listen(port, () => {
  logger.info(`🚀 Madhuvastwa AI backend running on port ${port}`);
  if (env.NODE_ENV !== "test") {
    startWorkers();
  }
});

process.on("SIGINT", () => {
  server.close(() => {
    logger.info("Server gracefully shutdown");
    process.exit(0);
  });
});

