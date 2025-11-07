import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      details: err.flatten(),
    });
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Unexpected error";

  if (!(err instanceof AppError)) {
    logger.error("Unhandled error", { error: err });
  }

  return res.status(statusCode).json({
    status: "error",
    message,
  });
};

