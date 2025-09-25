import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { getRSLById } from "@/lib/rsl";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
import { Icons } from "@/components/shared/icons";
import { DocumentActions } from "@/components/rsl/document-actions";
import { RSLActionsForm } from "@/components/forms/rsl-actions-form";

export const metadata = constructMetadata({
  title: "RSL Document – RSL Editor",
  description: "View and manage your RSL document.",
});

interface RSLViewPageProps {
  params: {
    id: string;
  };
}

export default async function RSLViewPage({ params }: RSLViewPageProps) {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  const rsl = await getRSLById(params.id, user.id);

  if (!rsl) {
    redirect("/dashboard/rsl");
  }

  return (
    <>
      <DashboardHeader
        heading="RSL Document"
        text="View and manage your RSL document"
      >
        <div className="flex gap-2">
          <Link href="/dashboard/rsl">
            <Button variant="outline">
              <Icons.arrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>

          {/* Action Buttons - Client-side form */}
          <RSLActionsForm rsl={rsl} />

          <Link href={`/dashboard/rsl/${params.id}/edit`}>
            <Button>
              <Icons.edit className="mr-2 size-4" />
              Edit RSL
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="flex">
        <div className="w-3/5 min-w-0 flex-1 pr-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">RSL Document</CardTitle>
                <CardDescription>
                  Your RSL XML document. You can copy, download, or edit it using the actions panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative max-h-[70vh] overflow-auto rounded-lg border bg-background">
                  <RSLActionsForm rsl={rsl} variant="copy-button" />
                  <div className="p-4 pr-16">
                    <HighlightedXml
                      code={rsl.xmlContent || ''}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Document Info */}
        <DocumentActions
          generatedXml={rsl.xmlContent || ''}
          crawledLinks={[]}
          crawlSummary={null}
          url={rsl.websiteUrl}
          protocol=""
          mode="view"
          createdAt={rsl.createdAt}
          updatedAt={rsl.updatedAt}
        />
      </div>
    </>
  );
}
