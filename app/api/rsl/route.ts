import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    const body = await req.json();
    const { websiteUrl, xmlContent } = body;

    if (!websiteUrl || !xmlContent) {
      return new Response("Missing required fields: websiteUrl and xmlContent", { 
        status: 400 
      });
    }

    // Create the RSL record in the database
    const rsl = await prisma.rsl.create({
      data: {
        websiteUrl,
        xmlContent,
        userId: currentUser.id!,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return Response.json({ 
      success: true, 
      data: {
        id: rsl.id,
        websiteUrl: rsl.websiteUrl,
        createdAt: rsl.createdAt,
      }
    });
    
  } catch (error) {
    console.error("Error saving RSL:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    // Get all RSLs for the current user
    const rsls = await prisma.rsl.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        websiteUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ 
      success: true, 
      data: rsls 
    });
    
  } catch (error) {
    console.error("Error fetching RSLs:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
