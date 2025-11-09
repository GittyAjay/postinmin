"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTemplateToPostController = exports.generateCalendarController = void 0;
const zod_1 = require("zod");
const calendarService_1 = require("../services/calendarService");
const asyncHandler_1 = require("../utils/asyncHandler");
const generateSchema = zod_1.z.object({
    body: zod_1.z.object({
        businessId: zod_1.z.string(),
        startDate: zod_1.z.string(),
        days: zod_1.z.number().min(1).max(60),
        variants: zod_1.z.number().min(1).max(5).optional(),
    }),
});
exports.generateCalendarController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = generateSchema.parse({ body: req.body });
    const result = await (0, calendarService_1.generateCalendar)({ ...parsed.body, ownerId: req.user.id });
    res.status(201).json(result);
});
const applyTemplateSchema = zod_1.z.object({
    params: zod_1.z.object({
        postId: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        templateId: zod_1.z.string().nullable().optional(),
    }),
});
exports.applyTemplateToPostController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = applyTemplateSchema.parse({ params: req.params, body: req.body });
    const updated = await (0, calendarService_1.applyTemplateToPost)({
        postId: parsed.params.postId,
        templateId: parsed.body.templateId ?? null,
        ownerId: req.user?.id,
    });
    res.json(updated);
});
//# sourceMappingURL=calendarController.js.map