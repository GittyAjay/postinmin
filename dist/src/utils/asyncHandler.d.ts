import { NextFunction, Request, Response } from "express";
export declare const asyncHandler: (handler: (req: Request, res: Response, next: NextFunction) => Promise<void | unknown>) => (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
//# sourceMappingURL=asyncHandler.d.ts.map