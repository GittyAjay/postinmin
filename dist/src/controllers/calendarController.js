"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCalendarController = void 0;
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
//# sourceMappingURL=calendarController.js.map