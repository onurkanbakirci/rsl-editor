import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    const { id } = params as { id: string };
    
    if (!id) {
      return new Response("RSL ID is required", { status: 400 });
    }

    // Check if the RSL exists and belongs to the current user
    const existingRsl = await prisma.rsl.findFirst({
      where: {
        id: id,
        userId: currentUser.id,
      },
    });

    if (!existingRsl) {
      return new Response("RSL not found", { status: 404 });
    }

    // Delete the RSL
    await prisma.rsl.delete({
      where: {
        id: id,
      },
    });

    return Response.json({ 
      success: true, 
      message: "RSL deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting RSL:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    const { id } = params as { id: string };
    
    if (!id) {
      return new Response("RSL ID is required", { status: 400 });
    }

    // Get the specific RSL for the current user
    const rsl = await prisma.rsl.findFirst({
      where: {
        id: id,
        userId: currentUser.id,
      },
      select: {
        id: true,
        websiteUrl: true,
        xmlContent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rsl) {
      return new Response("RSL not found", { status: 404 });
    }

    return Response.json({ 
      success: true, 
      data: rsl 
    });
    
  } catch (error) {
    console.error("Error fetching RSL:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
