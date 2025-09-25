import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { RslStats } from "@/components/dashboard/rsl-stats";

export const metadata = constructMetadata({
  title: "Dashboard – RSL Editor",
  description: "Create and manage content.",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <>
      <DashboardHeader
        heading="Dashboard"
        text={`Current Role : ${user?.role} — Change your role in settings.`}
      />
      
      <RslStats />
    </>
  );
}
