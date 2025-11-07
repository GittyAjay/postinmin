import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../utils/errors";

const SESSION_COOKIE = process.env.SESSION_COOKIE ?? "madhuvastwa_session";

const extractToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${SESSION_COOKIE}=`)) {
        return cookie.substring(SESSION_COOKIE.length + 1);
      }
    }
  }

  return null;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Express.UserClaims;
    req.user = payload;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const authorizeRoles = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    return next();
  };

