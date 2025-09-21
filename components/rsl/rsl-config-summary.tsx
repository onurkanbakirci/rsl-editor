import { RslLicense } from "@/lib/rsl-generator";

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
      licenses?: RslLicense[];
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

interface RslConfigSummaryProps {
  crawledLinks: CrawledLink[];
  mode?: "create" | "edit";
}

export function RslConfigSummary({ crawledLinks, mode = "create" }: RslConfigSummaryProps) {
  const selectedLinks = crawledLinks.filter((link) => link.selected);
  const configuredLinks = selectedLinks.filter(
    (link) =>
      link.formData?.rsl &&
      (link.formData.rsl.licenses?.length || 0) > 0,
  );

  // For edit mode, separate existing and new links
  const existingLinks = mode === "edit" ? crawledLinks.filter(link => !link.isNew) : [];
  const newLinks = mode === "edit" ? crawledLinks.filter(link => link.isNew) : [];

  const totalLicenses = configuredLinks.reduce(
    (total, link) =>
      total + (link.formData?.rsl?.licenses?.length || 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          RSL Configuration
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              URLs selected:
            </span>
            <span className="font-medium">
              {selectedLinks.length}
            </span>
          </div>

          {mode === "edit" && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Existing URLs:
                </span>
                <span className="font-medium">
                  {existingLinks.length}
                </span>
              </div>

              {newLinks.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    New URLs:
                  </span>
                  <span className="font-medium text-green-600">
                    {newLinks.length}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              URLs configured:
            </span>
            <span className="font-medium">
              {configuredLinks.length}
            </span>
          </div>

          {configuredLinks.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Total licenses:
              </span>
              <span className="font-medium">
                {totalLicenses}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
