"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPosts = void 0;
const prisma_1 = require("../config/prisma");
const searchPosts = async (businessId, query) => {
    return prisma_1.prisma.scheduledPost.findMany({
        where: {
            businessId,
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { subtitle: { contains: query, mode: "insensitive" } },
                { caption: { contains: query, mode: "insensitive" } },
                { hashtags: { hasSome: query.split(" ").filter(Boolean) } },
                { emotion: { equals: query, mode: "insensitive" } },
                { theme: { contains: query, mode: "insensitive" } },
            ],
        },
        orderBy: { date: "desc" },
        take: 50,
    });
};
exports.searchPosts = searchPosts;
//# sourceMappingURL=searchService.js.map