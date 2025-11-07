import { prisma } from "../config/prisma";

export const searchPosts = async (businessId: string, query: string) => {
  return prisma.scheduledPost.findMany({
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

