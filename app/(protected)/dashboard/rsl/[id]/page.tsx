"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
import { Icons } from "@/components/shared/icons";
import { DocumentActions } from "@/components/rsl/document-actions";
import Link from "next/link";

// RSL data structure from API
interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent?: string;
  createdAt: string;
  updatedAt: string;
}

export default function RSLViewPage() {
  const params = useParams();
  const router = useRouter();
  const [rsl, setRsl] = useState<RSL | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const rslId = params.id as string;

  // Fetch RSL data
  useEffect(() => {
    const fetchRslData = async () => {
      if (!rslId) return;

      try {
        const response = await fetch(`/api/rsl/${rslId}`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const rslData = result.data;
            setRsl(rslData);
          } else {
            toast.error("Failed to load RSL", {
              description: "The RSL document could not be found.",
            });
            router.push('/dashboard/rsl');
          }
        } else if (response.status === 404) {
          toast.error("RSL not found", {
            description: "The requested RSL document does not exist.",
          });
          router.push('/dashboard/rsl');
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching RSL:', error);
        toast.error("Failed to load RSL", {
          description: "There was an error loading the RSL document. Please try again.",
        });
        router.push('/dashboard/rsl');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRslData();
  }, [rslId, router]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <DashboardHeader
          heading="RSL Document"
          text="Loading RSL document..."
        >
          <div className="flex gap-2">
            <Link href="/dashboard/rsl">
              <Button variant="outline">
                <Icons.arrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </Link>
          </div>
        </DashboardHeader>

        <div className="max-w-6xl">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Icons.spinner className="size-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Error state (RSL not found)
  if (!rsl) {
    return (
      <>
        <DashboardHeader
          heading="RSL Not Found"
          text="The requested RSL document could not be found."
        >
          <div className="flex gap-2">
            <Link href="/dashboard/rsl">
              <Button variant="outline">
                <Icons.arrowLeft className="mr-2 size-4" />
                Back to RSL List
              </Button>
            </Link>
          </div>
        </DashboardHeader>
      </>
    );
  }

  // Main view - show the RSL document with preview functionality
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

          {/* Action Buttons */}
          <Button
            onClick={() => {
              const blob = new Blob([rsl.xmlContent || ''], { type: 'application/xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'rsl-document.xml';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success("XML file downloaded");
            }}
            variant="outline"
          >
            <Icons.download className="mr-2 size-4" />
            Download
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(rsl.xmlContent || '');
              toast.success("XML copied to clipboard");
            }}
          >
            <Icons.copy className="mr-2 size-4" />
            Copy
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([rsl.xmlContent || ''], { type: 'application/xml' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Icons.arrowUpRight className="mr-2 size-4" />
            Open
          </Button>

          <Link href={`/dashboard/rsl/${rslId}/edit`}>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-3 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={() => {
                      navigator.clipboard.writeText(rsl.xmlContent || '');
                      toast.success("XML copied to clipboard");
                    }}
                  >
                    <Icons.copy className="size-4" />
                  </Button>
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
