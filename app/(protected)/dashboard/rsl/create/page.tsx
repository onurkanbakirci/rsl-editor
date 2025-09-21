"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  generateRslXml,
  validateRslData,
  createNewLicense,
  getAvailableUsageTypes,
  getAvailableUserTypes,
  getAvailableGeoCodes,
  getAvailablePaymentTypes,
  getAvailableWarrantyTypes,
  getAvailableDisclaimerTypes,
  getAvailableCurrencies,
  type RslContent,
  type RslLicense,
} from "@/lib/rsl-generator";
import {
  generateRssWithRsl,
  createRssOptionsFromWebsite,
  validateRssIntegration,
  generateRobotsWithRsl,
  createRobotsOptionsFromWebsite,
  validateRobotsIntegration,
  generateWebPagesWithEmbeddedRsl,
  createWebPagesOptionsFromWebsite,
  generateEpubWithRsl,
  createMediaFilesOptionsFromWebsite,
} from "@/lib/integration-generators";
// Remove all crawling-related imports - everything is handled server-side now
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
import { Icons } from "@/components/shared/icons";
import { IntegrationGuide } from "@/components/rsl/integration-guide";
import { DocumentActions } from "@/components/rsl/document-actions";
import { AddLinksSection } from "@/components/rsl/add-links-section";
import { LinkSources } from "@/components/rsl/link-sources";
import { RslConfigSummary } from "@/components/rsl/rsl-config-summary";

// Types for crawled links with RSL data
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

// All crawling is now handled server-side

// Removed InitialRSLData interface - not needed for create-only page

// Helper function to generate RSS with RSL using the new library
const generateRssRslContent = (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string = 'https') => {
  // Convert CrawledLink to RslContent format
  const rslContents: RslContent[] = crawledLinks
    .filter(link => link.selected && link.formData?.rsl)
    .map(link => ({
      url: link.url,
      rsl: {
        licenseServer: link.formData!.rsl!.licenseServer,
        encrypted: link.formData!.rsl!.encrypted,
        lastModified: link.formData!.rsl!.lastModified,
        licenses: link.formData!.rsl!.licenses || [],
        metadata: link.formData!.rsl!.metadata
      }
    }));

  // Create RSS options from website configuration
  const rssOptions = createRssOptionsFromWebsite(`${protocol}://${websiteUrl}`);

  // Generate RSS with RSL integration using template strategy
  return generateRssWithRsl(rslContents, rssOptions);
};

// Helper function to generate robots.txt with RSL using the new library
const generateRobotsRslContent = (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string = 'https') => {
  // Convert CrawledLink to RslContent format
  const rslContents: RslContent[] = crawledLinks
    .filter(link => link.selected && link.formData?.rsl)
    .map(link => ({
      url: link.url,
      rsl: {
        licenseServer: link.formData!.rsl!.licenseServer,
        encrypted: link.formData!.rsl!.encrypted,
        lastModified: link.formData!.rsl!.lastModified,
        licenses: link.formData!.rsl!.licenses || [],
        metadata: link.formData!.rsl!.metadata
      }
    }));

  // Create robots.txt options from website configuration
  const robotsOptions = createRobotsOptionsFromWebsite(`${protocol}://${websiteUrl}`);

  // Generate robots.txt with RSL integration using template strategy
  return generateRobotsWithRsl(rslContents, robotsOptions);
};

// Helper function to generate web pages with RSL using the new library
const generateWebPagesRslContent = (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string = 'https') => {
  // Convert CrawledLink to RslContent format
  const rslContents: RslContent[] = crawledLinks
    .filter(link => link.selected && link.formData?.rsl)
    .map(link => ({
      url: link.url,
      rsl: {
        licenseServer: link.formData!.rsl!.licenseServer,
        encrypted: link.formData!.rsl!.encrypted,
        lastModified: link.formData!.rsl!.lastModified,
        licenses: link.formData!.rsl!.licenses || [],
        metadata: link.formData!.rsl!.metadata
      }
    }));

  // Create web pages options from website configuration
  const webPagesOptions = createWebPagesOptionsFromWebsite(`${protocol}://${websiteUrl}`, 'embedded');

  // Generate web pages with RSL integration using embedded strategy
  return generateWebPagesWithEmbeddedRsl(rslContents, webPagesOptions);
};

// Helper function to generate media files with RSL using the new library
const generateMediaFilesRslContent = (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string = 'https') => {
  // Convert CrawledLink to RslContent format
  const rslContents: RslContent[] = crawledLinks
    .filter(link => link.selected && link.formData?.rsl)
    .map(link => ({
      url: link.url,
      rsl: {
        licenseServer: link.formData!.rsl!.licenseServer,
        encrypted: link.formData!.rsl!.encrypted,
        lastModified: link.formData!.rsl!.lastModified,
        licenses: link.formData!.rsl!.licenses || [],
        metadata: link.formData!.rsl!.metadata
      }
    }));

  // Create media files options from website configuration
  const mediaFilesOptions = createMediaFilesOptionsFromWebsite(`${protocol}://${websiteUrl}`, 'epub');

  // Generate media files with RSL integration using EPUB strategy
  return generateEpubWithRsl(rslContents, mediaFilesOptions);
};

export default function CreateRSLPage() {
  const router = useRouter();

  // Initialize state for create mode only
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);
  const [crawlSummary, setCrawlSummary] = useState<{
    totalPages: number;
    totalSize: number;
    crawlTime: number;
    baseUrl: string;
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Initialize URL and protocol for create mode
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState("https");

  // Removed linkCount - using actual crawled data now
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [showCrawledLinks, setShowCrawledLinks] = useState(false);
  const [selectedPageForm, setSelectedPageForm] = useState<string | null>(null);

  // URL expansion and license tab state for create mode
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [activeLicenseTab, setActiveLicenseTab] = useState<Record<string, string>>({});
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [generatedXml, setGeneratedXml] = useState("");
  const [isGeneratingXml, setIsGeneratingXml] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFetchLinks = async () => {
    if (!url) return;

    setIsCrawling(true);
    try {
      // Construct the full URL
      const fullUrl = `${protocol}://${url}`;

      // Determine crawling method based on current tab
      const activeTab = document.querySelector('[data-state="active"]')?.getAttribute('value') || 'crawl';

      // Prepare crawl options for full website crawl
      const maxPages = parseInt((document.getElementById('max-pages') as HTMLInputElement)?.value || '100');
      const maxDepth = parseInt((document.getElementById('depth') as HTMLInputElement)?.value || '3');
      const excludePatterns = (document.getElementById('exclude') as HTMLInputElement)?.value
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0) || [];

      // Call the crawl API - server handles everything
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fullUrl,
          crawlType: activeTab,
          options: {
            maxPages,
            maxDepth,
            excludePatterns,
          },
        }),
      });

      const apiResult = await response.json();

      if (!response.ok) {
        throw new Error(apiResult.error || 'API request failed');
      }

      if (apiResult.success) {
        // Create mode - use new links directly
        setCrawledLinks(apiResult.links);
        setCrawlSummary(apiResult.summary);
        toast.success(apiResult.summary.message);
        setShowCrawledLinks(true);
      } else {
        toast.error('Crawling failed', {
          description: apiResult.errors.join(', '),
        });
      }
    } catch (error) {
      console.error('Crawling error:', error);
      toast.error('Crawling failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsCrawling(false);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = crawledLinks.every((link) => link.selected);
    setCrawledLinks((prev) =>
      prev.map((link) => ({
        ...link,
        selected: !allSelected,
      })),
    );
  };

  const toggleLinkSelection = (linkUrl: string) => {
    setCrawledLinks((prev) =>
      prev.map((link) => {
        if (link.url === linkUrl) {
          return { ...link, selected: !link.selected };
        }
        return link;
      }),
    );
  };

  const updatePageFormData = (
    pageUrl: string,
    formData: Partial<CrawledLink["formData"]>,
  ) => {
    setCrawledLinks((prev) =>
      prev.map((link) =>
        link.url === pageUrl
          ? {
            ...link,
            formData: { ...link.formData, ...formData },
          }
          : link,
      ),
    );
  };

  const addLicense = (pageUrl: string) => {
    const currentLicenses = getCurrentLicenses(pageUrl);
    const newLicense = createNewLicense(currentLicenses.length);

    const currentRsl = getCurrentRslData(pageUrl);

    // Ensure metadata is properly initialized
    const defaultMetadata = {
      schemaUrl: '',
      copyrightHolder: '',
      copyrightType: 'person' as const,
      contactEmail: '',
      contactUrl: '',
      termsUrl: ''
    };

    updatePageFormData(pageUrl, {
      rsl: {
        licenseServer: '',
        encrypted: false,
        lastModified: '',
        ...currentRsl,
        licenses: [...currentLicenses, newLicense],
        metadata: {
          ...defaultMetadata,
          ...currentRsl?.metadata,
        },
      },
    });

    // Set the new license as active
    setActiveLicenseTab((prev) => ({ ...prev, [pageUrl]: newLicense.id }));
  };

  const removeLicense = (pageUrl: string, licenseId: string) => {
    const currentRsl = getCurrentRslData(pageUrl);
    const currentLicenses = currentRsl?.licenses || [];
    const filteredLicenses = currentLicenses.filter((l) => l.id !== licenseId);

    updatePageFormData(pageUrl, {
      rsl: {
        ...currentRsl,
        licenses: filteredLicenses,
      },
    });

    // If we removed the active license, switch to the first one
    if (
      activeLicenseTab[pageUrl] === licenseId &&
      filteredLicenses.length > 0
    ) {
      setActiveLicenseTab((prev) => ({
        ...prev,
        [pageUrl]: filteredLicenses[0].id,
      }));
    }
  };

  const getCurrentRslData = (pageUrl: string) => {
    return crawledLinks.find((l) => l.url === pageUrl)?.formData?.rsl;
  };

  const getCurrentLicenses = (pageUrl: string) => {
    return getCurrentRslData(pageUrl)?.licenses || [];
  };

  const getCurrentLicense = (pageUrl: string) => {
    const licenses = getCurrentLicenses(pageUrl);
    const activeId = activeLicenseTab[pageUrl];
    return licenses.find((l) => l.id === activeId) || licenses[0];
  };

  const updateCurrentLicense = (pageUrl: string, licenseData: any) => {
    const currentRsl = getCurrentRslData(pageUrl);
    const currentLicenses = getCurrentLicenses(pageUrl);
    const activeId = activeLicenseTab[pageUrl] || currentLicenses[0]?.id;

    const updatedLicenses = currentLicenses.map((license) =>
      license.id === activeId ? { ...license, ...licenseData } : license,
    );

    updatePageFormData(pageUrl, {
      rsl: {
        ...currentRsl,
        licenses: updatedLicenses,
      },
    });
  };

  const generateRslXmlFromLinks = () => {
    const selectedLinks = crawledLinks.filter(
      (link) => link.selected && link.formData?.rsl,
    );

    const rslContents: RslContent[] = selectedLinks.map(link => ({
      url: link.url,
      rsl: link.formData!.rsl!,
    }));

    // Validate the data before generation
    const validation = validateRslData(rslContents);
    if (!validation.isValid) {
      console.warn('RSL validation warnings:', validation.errors);
      // Continue anyway, as some warnings might be acceptable
    }

    return generateRslXml(rslContents);
  };

  const handleCreateRsl = async () => {
    setIsGeneratingXml(true);

    // Simulate loading time for better UX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const xml = generateRslXmlFromLinks();
    setGeneratedXml(xml);
    setIsGeneratingXml(false);
    setShowXmlPreview(true);
  };

  const handleSaveRsl = async () => {
    if (!generatedXml) {
      toast.error("No RSL document to save", {
        description:
          "Please generate an RSL document first by clicking 'Create RSL'.",
      });
      return;
    }

    if (!url) {
      toast.error("Missing website URL", {
        description: "Please enter a website URL before saving.",
      });
      return;
    }

    setIsSaving(true);

    try {
      // POST for new documents only (create mode)
      const response = await fetch("/api/rsl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: `${protocol}://${url}`,
          xmlContent: generatedXml,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("RSL saved successfully!", {
            description: `Your RSL document for ${protocol}://${url} has been saved.`,
          });
          // Redirect to RSL list page after successful save
          router.push('/dashboard/rsl');
        } else {
          toast.error("Failed to save RSL", {
            description: "There was an error saving your RSL document. Please try again.",
          });
        }
      } else {
        toast.error("Something went wrong", {
          description: `HTTP error ${response.status}. Please try again.`,
        });
      }
    } catch (error) {
      console.error("Error saving RSL:", error);
      toast.error("Network error", {
        description:
          "Unable to connect to the server. Please check your connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUrlExpanded = (url: string) => {
    setExpandedUrls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };


  // XML Preview state
  if (showXmlPreview) {
    return (
      <>
        <DashboardHeader
          heading="RSL Document Preview"
          text="Generated RSL XML document based on your configuration"
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowXmlPreview(false)}>
              <Icons.arrowLeft className="mr-2 size-4" />
              Back to Form
            </Button>
          </div>
        </DashboardHeader>

        <div className="flex max-w-full overflow-hidden lg:flex-row flex-col gap-6">
          <div className="lg:w-3/5 w-full min-w-0 flex-1 overflow-hidden">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    RSL Document
                  </CardTitle>
                  <CardDescription>
                    Review your generated RSL XML document. You can copy, save,
                    or download it from the actions panel.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative max-h-[70vh] overflow-auto rounded-lg border bg-background">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-3 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedXml);
                        toast.success("XML copied to clipboard");
                      }}
                    >
                      <Icons.copy className="size-4" />
                    </Button>
                    <div className="p-4 pr-16 overflow-x-auto">
                      <HighlightedXml
                        code={generatedXml}
                        className="text-sm leading-relaxed break-all whitespace-pre-wrap"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Integration Guide */}
              <IntegrationGuide
                crawledLinks={crawledLinks}
                websiteUrl={url}
                protocol={protocol}
                generateRssContent={generateRssRslContent}
                generateRobotsContent={generateRobotsRslContent}
                generateWebPagesContent={generateWebPagesRslContent}
                generateMediaFilesContent={generateMediaFilesRslContent}
                advanced={true}
              />
            </div>
          </div>

          {/* Right Sidebar - Actions */}
          <DocumentActions
            generatedXml={generatedXml}
            crawledLinks={crawledLinks}
            crawlSummary={crawlSummary}
            url={url}
            protocol={protocol}
            isSaving={isSaving}
            onSave={handleSaveRsl}
            mode="create"
          />
        </div>
      </>
    );
  }

  // Main form state
  return (
    <>
      <DashboardHeader
        heading="Create RSL"
        text="Crawl web pages or submit sitemaps to update your AI with the latest content."
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

      <div className="flex max-w-full overflow-hidden lg:flex-row flex-col gap-6">
        <div className="lg:w-3/5 w-full min-w-0 flex-1 overflow-hidden">
          <div className="space-y-6">
            <AddLinksSection
              mode="create"
              url={url}
              protocol={protocol}
              isCrawling={isCrawling}
              onUrlChange={setUrl}
              onProtocolChange={setProtocol}
              onFetchLinks={handleFetchLinks}
            />

            {/* Link Sources Section - only show after crawling */}
            {(showCrawledLinks || isCrawling) && (
              <LinkSources
                crawledLinks={crawledLinks}
                isCrawling={isCrawling}
                searchTerm={searchTerm}
                sortBy={sortBy}
                expandedUrls={expandedUrls}
                activeLicenseTab={activeLicenseTab}
                onSearchTermChange={setSearchTerm}
                onSortByChange={setSortBy}
                onToggleSelectAll={toggleSelectAll}
                onToggleLinkSelection={toggleLinkSelection}
                onToggleUrlExpanded={toggleUrlExpanded}
                onUpdatePageFormData={updatePageFormData}
                onAddLicense={addLicense}
                onRemoveLicense={removeLicense}
                onSetActiveLicenseTab={setActiveLicenseTab}
                mode="create"
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Sources */}
        <div
          className="sticky top-0 lg:h-screen h-auto lg:w-2/5 w-full min-w-0 overflow-y-auto lg:pl-6 p-0 bg-muted/30 dark:bg-muted/10"
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {crawlSummary?.totalPages || crawledLinks.length} Links
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    {crawlSummary ? 'Crawled' : 'Ready'}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total size</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {crawlSummary ? `${(crawlSummary.totalSize / 1024).toFixed(1)} KB` : 'TBD'}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: crawlSummary ? '100%' : '0%'
                    }}
                  />
                </div>
              </div>

              {/* RSL Configuration Summary */}
              {showCrawledLinks && (
                <RslConfigSummary
                  crawledLinks={crawledLinks}
                  mode="create"
                />
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCreateRsl}
                disabled={isGeneratingXml}
              >
                {isGeneratingXml ? (
                  <>
                    <Icons.spinner className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Create RSL"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </>
  );
}