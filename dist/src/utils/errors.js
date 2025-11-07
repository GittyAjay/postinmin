"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertExists = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const assertExists = (value, message) => {
    if (value === undefined || value === null) {
        throw new AppError(message, 404);
    }
    return value;
};
exports.assertExists = assertExists;
//# sourceMappingURL=errors.js.map