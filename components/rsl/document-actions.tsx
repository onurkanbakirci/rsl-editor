"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";

interface CrawledLink {
  id: string;
  url: string;
  status: "crawling" | "completed" | "failed";
  isNew?: boolean;
  selected: boolean;
  formData?: {
    rsl?: {
      licenseServer?: string;
      encrypted?: boolean;
      lastModified?: string;
      licenses?: any[];
      metadata?: {
        schemaUrl?: string;
        copyrightHolder?: string;
        copyrightType?: "person" | "organization";
        contactEmail?: string;
        contactUrl?: string;
        termsUrl?: string;
      };
    };
  };
}

interface DocumentActionsProps {
  generatedXml: string;
  crawledLinks: CrawledLink[];
  crawlSummary?: {
    baseUrl: string;
    totalPages: number;
    totalSize: number;
    crawlTime: number;
    message: string;
  } | null;
  url: string;
  protocol: string;
  mode?: "create" | "edit" | "view";
  // Optional fields for view mode
  createdAt?: string;
  updatedAt?: string;
}

export function DocumentActions({
  generatedXml,
  crawledLinks,
  crawlSummary,
  url,
  protocol,
  mode = "create",
  createdAt,
  updatedAt
}: DocumentActionsProps) {

  const selectedLinks = crawledLinks.filter((link) => link.selected);
  const totalLicenses = selectedLinks
    .filter((link) => link.formData?.rsl)
    .reduce(
      (total, link) => total + (link.formData?.rsl?.licenses?.length || 0),
      0,
    );

  return (
    <div className="sticky top-0 lg:h-screen h-auto lg:w-2/5 w-full min-w-0 overflow-y-auto lg:pl-6 p-0 bg-muted/30 dark:bg-muted/10">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.shield className="size-5" />
            Document Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Website:</span>
              <span
                className="ml-2 max-w-[150px] truncate font-medium"
                title={crawlSummary?.baseUrl || `${protocol}://${url}`}
              >
                {crawlSummary?.baseUrl || `${protocol}://${url}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Document size:
              </span>
              <span className="font-medium">
                {(new Blob([generatedXml]).size / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Content URLs:</span>
              <span className="font-medium">
                {selectedLinks.length}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total licenses:
              </span>
              <span className="font-medium">
                {totalLicenses}
              </span>
            </div>

            {/* Show created/updated dates for view mode */}
            {mode === "view" && createdAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {mode === "view" && updatedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last updated:</span>
                <span className="font-medium">
                  {new Date(updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="size-2 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">
                Document ready
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your RSL document has been {mode === "create" ? "generated" : "updated"} successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
