import { NextFunction, Request, Response } from "express";

import { checkQuota, incrementQuota } from "../services/monetizationService";

export const quotaGuard = (quotaKey: string) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    try {
      await checkQuota(req.user.id, quotaKey);
      await incrementQuota(req.user.id, quotaKey);
      return next();
    } catch (error) {
      return next(error);
    }
  };

