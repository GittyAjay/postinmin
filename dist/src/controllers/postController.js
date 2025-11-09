"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPostsController = void 0;
const zod_1 = require("zod");
const calendarService_1 = require("../services/calendarService");
const asyncHandler_1 = require("../utils/asyncHandler");
const listSchema = zod_1.z.object({
    businessId: zod_1.z.string(),
});
exports.listPostsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { businessId } = listSchema.parse(req.query);
    const posts = await (0, calendarService_1.listScheduledPosts)(businessId, req.user?.id);
    res.json(posts);
});
//# sourceMappingURL=postController.js.map