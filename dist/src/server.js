"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const queues_1 = require("./queues");
const logger_1 = require("./utils/logger");
const port = env_1.env.PORT;
const server = app_1.default.listen(port, () => {
    logger_1.logger.info(`🚀 postinmin backend running on port ${port}`);
    if (env_1.env.NODE_ENV !== "test") {
        (0, queues_1.startWorkers)();
    }
});
process.on("SIGINT", () => {
    server.close(() => {
        logger_1.logger.info("Server gracefully shutdown");
        process.exit(0);
    });
});
//# sourceMappingURL=server.js.map