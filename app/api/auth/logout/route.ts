import { signOut } from "@/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await signOut({ 
      redirectTo: "/",
      redirect: false 
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({ error: "Logout failed" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
