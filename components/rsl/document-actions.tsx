"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  isSaving: boolean;
  onSave: () => void;
  mode?: "create" | "edit";
}

export function DocumentActions({
  generatedXml,
  crawledLinks,
  crawlSummary,
  url,
  protocol,
  isSaving,
  onSave,
  mode = "create"
}: DocumentActionsProps) {
  const handleDownload = () => {
    const blob = new Blob([generatedXml], {
      type: "application/xml",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "rsl-document.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    toast.success("XML file downloaded");
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedXml);
    toast.success("XML copied to clipboard");
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([generatedXml], {
      type: "application/xml",
    });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

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
            Document Actions
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
          </div>

          {/* Primary Actions */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Primary Actions
            </h4>

            <Button
              onClick={onSave}
              disabled={isSaving || !generatedXml || !url}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Icons.spinner className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.save className="mr-2 size-4" />
                  {mode === "create" ? "Save RSL Document" : "Update RSL Document"}
                </>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              disabled={isSaving}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Icons.download className="mr-2 size-4" />
              Download XML File
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Additional Options
            </h4>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleCopyToClipboard}
            >
              <Icons.copy className="mr-2 size-4" />
              Copy to Clipboard
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleOpenInNewTab}
            >
              <Icons.arrowUpRight className="mr-2 size-4" />
              Open in New Tab
            </Button>
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
              Your RSL document has been {mode === "create" ? "generated" : "updated"} successfully and is
              ready to save or download.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
