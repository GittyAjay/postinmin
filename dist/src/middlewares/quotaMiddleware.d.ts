import { NextFunction, Request, Response } from "express";
export declare const quotaGuard: (quotaKey: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=quotaMiddleware.d.ts.map