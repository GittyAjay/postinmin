import { NextFunction, Request, Response } from "express";
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map