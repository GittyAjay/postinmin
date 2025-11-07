import type { UserRole, PlanType } from "@prisma/client";

declare global {
  namespace Express {
    interface UserClaims {
      id: string;
      role: UserRole;
      planType?: PlanType;
    }

    interface Request {
      user?: UserClaims;
    }
  }
}

export {};

