import { Request, Response } from "express";
import { z } from "zod";

import { signup, login } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";

const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    role: z.enum(["ADMIN", "BUSINESS_OWNER"]).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const signupController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = signupSchema.parse({ body: req.body });
  const result = await signup(parsed.body);
  res.status(201).json(result);
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.parse({ body: req.body });
  const result = await login(parsed.body.email, parsed.body.password);
  res.json(result);
});

export const logoutController = asyncHandler(async (_req: Request, res: Response) => {
  res.status(204).send();
});

