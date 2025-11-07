"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new errors_1.AppError("Authentication required", 401));
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = payload;
        return next();
    }
    catch (error) {
        return next(new errors_1.AppError("Invalid or expired token", 401));
    }
};
exports.authenticate = authenticate;
const authorizeRoles = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new errors_1.AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
        return next(new errors_1.AppError("Insufficient permissions", 403));
    }
    return next();
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=authMiddleware.js.map