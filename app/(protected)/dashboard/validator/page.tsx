import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { ValidatorForm } from "@/components/forms/validator-form";
import { ValidatorHelp } from "@/components/validator/validator-help";

export const metadata = constructMetadata({
  title: "Validator – RSL Editor",
  description: "Validate your RSL documents for compliance and correctness.",
});

export default async function ValidatorPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading="Validator"
        text="Validate your RSL documents for compliance and correctness."
      />
      <div className="space-y-6">
        <ValidatorForm />
        <ValidatorHelp />
      </div>
    </>
  );
}
