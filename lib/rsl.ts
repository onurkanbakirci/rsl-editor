import { prisma } from "@/lib/db";

export const getRSLsByUserId = async (userId: string) => {
  try {
    const rsls = await prisma.rsl.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        websiteUrl: true,
        xmlContent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert dates to strings to match RSL type
    return rsls.map(rsl => ({
      ...rsl,
      createdAt: rsl.createdAt.toISOString(),
      updatedAt: rsl.updatedAt.toISOString(),
    }));
  } catch {
    return null;
  }
};

export const getRSLById = async (id: string, userId: string) => {
  try {
    const rsl = await prisma.rsl.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      select: {
        id: true,
        websiteUrl: true,
        xmlContent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rsl) return null;

    // Convert dates to strings to match RSL type
    return {
      ...rsl,
      createdAt: rsl.createdAt.toISOString(),
      updatedAt: rsl.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
};
