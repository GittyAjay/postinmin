"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBusinessController = exports.updateBusinessController = exports.getBusinessController = exports.listBusinessesController = exports.createBusinessController = void 0;
const zod_1 = require("zod");
const businessService_1 = require("../services/businessService");
const asyncHandler_1 = require("../utils/asyncHandler");
const businessSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string(),
        category: zod_1.z.string().optional(),
        targetAudience: zod_1.z.string().optional(),
        goals: zod_1.z.string().optional(),
        voiceTone: zod_1.z.string().optional(),
        brandColors: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        preferredEmotion: zod_1.z.string().optional(),
        preferredStyle: zod_1.z.string().optional(),
        voiceSampleText: zod_1.z.string().optional(),
        preferredPlatforms: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.createBusinessController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = businessSchema.parse({ body: req.body });
    const business = await (0, businessService_1.createBusiness)(req.user.id, parsed.body);
    res.status(201).json(business);
});
exports.listBusinessesController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const businesses = await (0, businessService_1.listBusinesses)(req.user.id);
    res.json(businesses);
});
exports.getBusinessController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const business = await (0, businessService_1.getBusinessById)(req.params.id, req.user.id);
    res.json(business);
});
exports.updateBusinessController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = businessSchema.shape.body.partial().parse(req.body);
    const business = await (0, businessService_1.updateBusiness)(req.params.id, req.user.id, parsed);
    res.json(business);
});
exports.deleteBusinessController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await (0, businessService_1.deleteBusiness)(req.params.id, req.user.id);
    res.status(204).send();
});
//# sourceMappingURL=businessController.js.map