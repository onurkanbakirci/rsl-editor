"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const deleteRslSchema = z.object({
  id: z.string().min(1, "RSL ID is required"),
  verification: z.string().min(1, "Verification is required").refine((val) => val === "delete rsl", {
    message: "Verification text must be 'delete rsl'",
  }),
});

export type FormData = z.infer<typeof deleteRslSchema>;

export async function deleteRsl(
  rslId: string,
  data: { id: string; verification: string }
): Promise<{ status: "success" } | { status: "error"; message: string }> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { status: "error", message: "Not authenticated" };
    }

    const validatedData = deleteRslSchema.safeParse(data);

    if (!validatedData.success) {
      return { 
        status: "error", 
        message: validatedData.error.errors[0]?.message ?? "Invalid input" 
      };
    }

    // Check if the RSL exists and belongs to the current user
    const existingRsl = await prisma.rsl.findFirst({
      where: {
        id: rslId,
        userId: user.id,
      },
    });

    if (!existingRsl) {
      return { status: "error", message: "RSL not found" };
    }

    // Delete the RSL
    await prisma.rsl.delete({
      where: {
        id: rslId,
      },
    });

    revalidatePath("/dashboard/rsl");

    return { status: "success" };
  } catch (error) {
    console.error("Error deleting RSL:", error);
    return { status: "error", message: "Something went wrong" };
  }
}
