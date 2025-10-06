import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { CreateRslForm } from "@/components/forms/create-rsl-form";

export default async function CreateRslPage() {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    redirect("/login");
  }

  return <CreateRslForm />;
}