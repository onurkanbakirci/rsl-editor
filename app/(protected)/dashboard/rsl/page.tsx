import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getCurrentUser } from "@/lib/session";
import { getRSLsByUserId } from "@/lib/rsl";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { RSLList } from "@/components/rsl/rsl-list";

export const metadata = constructMetadata({
  title: "RSL – Dashboard",
  description: "Create and manage your RSL configurations.",
});

export default async function RSLPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  const rsls = await getRSLsByUserId(user.id);

  return (
    <>
      <DashboardHeader
        heading="RSL"
        text="Create and manage your RSL configurations."
      >
        {rsls && rsls.length > 0 && (
          <Link href="/dashboard/rsl/create">
            <Button>
              <Icons.add className="mr-2 size-4" />
              New RSL
            </Button>
          </Link>
        )}
      </DashboardHeader>

      {rsls && rsls.length > 0 ? (
        <RSLList rsls={rsls} />
      ) : (
        <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4">
          <div className="mb-6 w-full max-w-[600px]">
            <Image
              src="/images/no-agents.webp"
              alt="No RSLs found"
              width={600}
              height={450}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="max-w-[500px] space-y-4 text-center">
            <h3 className="text-xl font-bold">No RSLs yet..</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Create your first RSL to start automating support, generating leads, and answering customer questions.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/rsl/create">
                <Button size="lg">
                  <Icons.add className="mr-2 size-4" />
                  New RSL
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
