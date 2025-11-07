"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutController = exports.loginController = exports.signupController = void 0;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const asyncHandler_1 = require("../utils/asyncHandler");
const signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        name: zod_1.z.string().optional(),
        role: zod_1.z.enum(["ADMIN", "BUSINESS_OWNER"]).optional(),
    }),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    }),
});
exports.signupController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = signupSchema.parse({ body: req.body });
    const result = await (0, authService_1.signup)(parsed.body);
    res.status(201).json(result);
});
exports.loginController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = loginSchema.parse({ body: req.body });
    const result = await (0, authService_1.login)(parsed.body.email, parsed.body.password);
    res.json(result);
});
exports.logoutController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.status(204).send();
});
//# sourceMappingURL=authController.js.map