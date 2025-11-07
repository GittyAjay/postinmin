import { createLogger, format, transports } from "winston";
import { env } from "../config/env";

const { combine, timestamp, printf, colorize, splat } = format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${ts} [${level}] ${message}${payload}`;
});

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), splat(), logFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp(), splat(), logFormat),
    }),
  ],
});

