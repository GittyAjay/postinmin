import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";

const SALT_ROUNDS = 10;

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
  role?: "ADMIN" | "BUSINESS_OWNER";
}

export const signup = async ({ email, password, name, role = "BUSINESS_OWNER" }: SignupInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role,
      plan: {
        create: {
          planType: "FREE",
          quota: { ai_requests: 10, image_generations: 10 },
          renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { plan: true },
  });

  return {
    user: sanitizeUser(user),
    token: generateToken({ id: user.id, role: user.role, planType: user.plan?.planType }),
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { plan: true } });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    user: sanitizeUser(user),
    token: generateToken({ id: user.id, role: user.role, planType: user.plan?.planType }),
  };
};

export const generateToken = (payload: Express.UserClaims) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "12h" });
};

const sanitizeUser = <T extends { password: string }>(user: T) => {
  const { password, ...rest } = user;
  return rest;
};

