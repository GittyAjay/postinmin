"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: "error",
            message: "Validation failed",
            details: err.flatten(),
        });
    }
    const statusCode = err instanceof errors_1.AppError ? err.statusCode : 500;
    const message = err.message || "Unexpected error";
    if (!(err instanceof errors_1.AppError)) {
        logger_1.logger.error("Unhandled error", { error: err });
    }
    return res.status(statusCode).json({
        status: "error",
        message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map