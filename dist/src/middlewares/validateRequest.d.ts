import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
export declare const validateRequest: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validateRequest.d.ts.map