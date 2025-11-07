"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const SALT_ROUNDS = 10;
const signup = async ({ email, password, name, role = "BUSINESS_OWNER" }) => {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new errors_1.AppError("Email already registered", 409);
    }
    const hashed = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            password: hashed,
            name,
            role,
            plan: {
                create: {
                    planType: "FREE",
                    quota: { ai_requests: 10, image_generations: 10 },
                    renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            },
        },
        include: { plan: true },
    });
    return {
        user: sanitizeUser(user),
        token: (0, exports.generateToken)({ id: user.id, role: user.role, planType: user.plan?.planType }),
    };
};
exports.signup = signup;
const login = async (email, password) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { email }, include: { plan: true } });
    if (!user) {
        throw new errors_1.AppError("Invalid credentials", 401);
    }
    const match = await bcrypt_1.default.compare(password, user.password);
    if (!match) {
        throw new errors_1.AppError("Invalid credentials", 401);
    }
    return {
        user: sanitizeUser(user),
        token: (0, exports.generateToken)({ id: user.id, role: user.role, planType: user.plan?.planType }),
    };
};
exports.login = login;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: "12h" });
};
exports.generateToken = generateToken;
const sanitizeUser = (user) => {
    const { password, ...rest } = user;
    return rest;
};
//# sourceMappingURL=authService.js.map