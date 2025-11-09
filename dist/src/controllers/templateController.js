"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendTemplateController = exports.deleteTemplateController = exports.updateTemplateController = exports.listTemplatesController = exports.createTemplateController = void 0;
const zod_1 = require("zod");
const templateService_1 = require("../services/templateService");
const prisma_1 = require("../config/prisma");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const ensureOwnership = async (businessId, ownerId) => {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.ownerId !== ownerId) {
        throw new errors_1.AppError("Unauthorized", 403);
    }
};
const placeholderSchema = zod_1.z.object({
    key: zod_1.z.string(),
    type: zod_1.z.enum(["text", "image", "shape"]),
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    width: zod_1.z.number().optional(),
    height: zod_1.z.number().optional(),
    maxWidth: zod_1.z.number().optional(),
    fontSize: zod_1.z.number().optional(),
    color: zod_1.z.string().optional(),
    borderColor: zod_1.z.string().optional(),
    borderWidth: zod_1.z.number().optional(),
    borderRadius: zod_1.z.number().optional(),
    imageUrl: zod_1.z.string().optional(),
    fontFamily: zod_1.z.string().optional(),
    fontWeight: zod_1.z.union([zod_1.z.enum(["normal", "bold"]), zod_1.z.number()]).optional(),
    fontStyle: zod_1.z.enum(["normal", "italic"]).optional(),
    textDecoration: zod_1.z.enum(["none", "underline", "line-through"]).optional(),
    align: zod_1.z.enum(["left", "center", "right"]).optional(),
    letterSpacing: zod_1.z.number().optional(),
    lineHeight: zod_1.z.number().optional(),
    opacity: zod_1.z.number().optional(),
    rotation: zod_1.z.number().optional(),
    locked: zod_1.z.boolean().optional(),
    zIndex: zod_1.z.number().optional(),
    shape: zod_1.z.enum(["rectangle", "circle", "triangle", "line"]).optional(),
    fillColor: zod_1.z.string().optional(),
    dashPattern: zod_1.z.array(zod_1.z.number()).optional(),
    sampleText: zod_1.z.string().optional(),
});
const templateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string(),
        backgroundUrl: zod_1.z.string().optional(),
        backgroundColor: zod_1.z.string().optional(),
        orientation: zod_1.z.enum(["square", "wide", "story"]),
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        emotionFit: zod_1.z.array(zod_1.z.string()).default([]),
        placeholders: zod_1.z.array(placeholderSchema),
        canvasPreset: zod_1.z.string().optional(),
        canvasWidth: zod_1.z.number().optional(),
        canvasHeight: zod_1.z.number().optional(),
    }),
});
exports.createTemplateController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = templateSchema.parse({ body: req.body });
    await ensureOwnership(req.params.businessId, req.user.id);
    const template = await (0, templateService_1.createTemplate)(req.params.businessId, {
        ...parsed.body,
        tags: parsed.body.tags ?? [],
        emotionFit: parsed.body.emotionFit ?? [],
    });
    res.status(201).json(template);
});
exports.listTemplatesController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await ensureOwnership(req.params.businessId, req.user.id);
    const templates = await (0, templateService_1.listTemplates)(req.params.businessId);
    res.json(templates);
});
exports.updateTemplateController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = templateSchema.shape.body.partial().parse(req.body);
    await ensureOwnership(req.params.businessId, req.user.id);
    const template = await (0, templateService_1.updateTemplate)(req.params.templateId, req.params.businessId, parsed);
    res.json(template);
});
exports.deleteTemplateController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await ensureOwnership(req.params.businessId, req.user.id);
    await (0, templateService_1.deleteTemplate)(req.params.templateId, req.params.businessId);
    res.status(204).send();
});
exports.recommendTemplateController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const schema = zod_1.z.object({
        body: zod_1.z.object({
            emotion: zod_1.z.string().optional(),
            style: zod_1.z.string().optional(),
            platform: zod_1.z.string().optional(),
            layoutType: zod_1.z.enum(["square", "wide", "story"]).optional(),
        }),
    });
    const parsed = schema.parse({ body: req.body });
    await ensureOwnership(req.params.businessId, req.user.id);
    const template = await (0, templateService_1.recommendTemplate)(req.params.businessId, parsed.body);
    res.json({ template });
});
//# sourceMappingURL=templateController.js.map