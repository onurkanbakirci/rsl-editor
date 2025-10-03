import { DashboardHeader } from "@/components/dashboard/header";
import { SkeletonSection } from "@/components/shared/section-skeleton";

export default function ValidatorLoading() {
  return (
    <>
      <DashboardHeader
        heading="Validator"
        text="Validate your RSL documents for compliance and correctness."
      />
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonSection />
          <SkeletonSection />
        </div>
        <SkeletonSection card />
      </div>
    </>
  );
}
