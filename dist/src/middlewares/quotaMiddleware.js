"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotaGuard = void 0;
const monetizationService_1 = require("../services/monetizationService");
const quotaGuard = (quotaKey) => async (req, _res, next) => {
    if (!req.user) {
        return next();
    }
    try {
        await (0, monetizationService_1.checkQuota)(req.user.id, quotaKey);
        await (0, monetizationService_1.incrementQuota)(req.user.id, quotaKey);
        return next();
    }
    catch (error) {
        return next(error);
    }
};
exports.quotaGuard = quotaGuard;
//# sourceMappingURL=quotaMiddleware.js.map