import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: unknown; query?: unknown; params?: unknown };

      if (parsed.body) req.body = parsed.body as typeof req.body;
      if (parsed.query) req.query = parsed.query as typeof req.query;
      if (parsed.params) req.params = parsed.params as typeof req.params;

      next();
    } catch (error) {
      next(error);
    }
  };

