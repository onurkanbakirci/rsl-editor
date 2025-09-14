import { DashboardHeader } from "@/components/dashboard/header";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

export default function RSLLoading() {
  return (
    <>
      <DashboardHeader
        heading="RSL"
        text="Create and manage your RSL configurations."
      >
        <Button disabled>
          <Icons.add className="mr-2 size-4" />
          Create New RSL
        </Button>
      </DashboardHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </>
  );
}
