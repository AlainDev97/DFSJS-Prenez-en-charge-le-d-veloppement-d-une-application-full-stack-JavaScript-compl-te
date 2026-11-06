import { prisma } from "../lib/prisma.js";

export const topicsRepository = {
  findAll(search?: string) {
    return prisma.topic.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined,
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 50,
    });
  },
};
