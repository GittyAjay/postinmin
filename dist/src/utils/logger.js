"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const env_1 = require("../config/env");
const { combine, timestamp, printf, colorize, splat } = winston_1.format;
const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
    const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} [${level}] ${message}${payload}`;
});
exports.logger = (0, winston_1.createLogger)({
    level: env_1.env.LOG_LEVEL,
    format: combine(timestamp(), splat(), logFormat),
    transports: [
        new winston_1.transports.Console({
            format: combine(colorize(), timestamp(), splat(), logFormat),
        }),
    ],
});
//# sourceMappingURL=logger.js.map