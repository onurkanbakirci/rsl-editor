import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    // Get all RSLs for the current user with creation dates
    const rsls = await prisma.rsl.findMany({
      where: {
        userId: currentUser.id,
      },
      select: {
        id: true,
        websiteUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisMonth = rsls.filter(rsl => 
      new Date(rsl.createdAt) >= startOfMonth
    ).length;
    
    const thisWeek = rsls.filter(rsl => 
      new Date(rsl.createdAt) >= startOfWeek
    ).length;

    // Generate chart data for the last 6 months
    const chartData: Array<{
      month: string;
      total: number;
      cumulative: number;
    }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthRsls = rsls.filter(rsl => {
        const rslDate = new Date(rsl.createdAt);
        return rslDate >= monthDate && rslDate < nextMonthDate;
      });

      chartData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        total: monthRsls.length,
        cumulative: rsls.filter(rsl => new Date(rsl.createdAt) <= nextMonthDate).length,
      });
    }

    const stats = {
      total: rsls.length,
      thisMonth,
      thisWeek,
      chartData,
      recentRsls: rsls.slice(0, 5), // Last 5 RSLs
    };

    return Response.json({ 
      success: true, 
      data: stats 
    });
    
  } catch (error) {
    console.error("Error fetching RSL stats:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
