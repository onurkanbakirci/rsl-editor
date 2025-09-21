"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  generateRslXml,
  validateRslData,
  createNewLicense,
  parseRslXmlToEditableContent,
  type RslContent,
  type RslLicense,
} from "@/lib/rsl-generator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";
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

interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditRSLPage() {
  const params = useParams();
  const router = useRouter();
  const rslId = params.id as string;

  // RSL data
  const [rsl, setRsl] = useState<RSL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state for edit mode
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

  // Initialize URL and protocol for edit mode
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState("https");

  const [showCrawledLinks, setShowCrawledLinks] = useState(false);

  // URL expansion and license tab state for edit mode
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [activeLicenseTab, setActiveLicenseTab] = useState<Record<string, string>>({});
  const [isGeneratingXml, setIsGeneratingXml] = useState(false);

  // Load existing RSL data
  useEffect(() => {
    const fetchRslData = async () => {
      if (!rslId) return;

      try {
        const response = await fetch(`/api/rsl/${rslId}`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setRsl(result.data);

            // Parse the website URL
            const websiteUrl = result.data.websiteUrl;
            try {
              const urlObj = new URL(websiteUrl);
              setProtocol(urlObj.protocol.replace(':', ''));
              setUrl(urlObj.hostname + urlObj.pathname + urlObj.search);
            } catch {
              setUrl(websiteUrl);
            }

            // Parse existing RSL data into crawled links format
            const editableContent = parseRslXmlToEditableContent(result.data.xmlContent, result.data.websiteUrl);
            const existingLinks: CrawledLink[] = editableContent.map((content, index) => ({
              id: `existing-${index}`,
              url: content.url,
              status: "completed" as const,
              selected: true,
              formData: {
                rsl: {
                  licenseServer: content.licenseServer,
                  encrypted: content.encrypted,
                  lastModified: content.lastModified,
                  licenses: content.licenses,
                  metadata: content.metadata,
                },
              },
            }));

            setCrawledLinks(existingLinks);
            setShowCrawledLinks(true);

            // Set active license tabs
            const initialTabs: Record<string, string> = {};
            existingLinks.forEach(link => {
              if (link.formData?.rsl?.licenses && link.formData.rsl.licenses.length > 0) {
                initialTabs[link.url] = link.formData.rsl.licenses[0].id;
              }
            });
            setActiveLicenseTab(initialTabs);

          } else {
            setError("Failed to load RSL data");
            toast.error("Failed to load RSL", {
              description: "The RSL document could not be found.",
            });
          }
        } else if (response.status === 404) {
          setError("RSL not found");
          toast.error("RSL not found", {
            description: "The requested RSL document does not exist.",
          });
        } else {
          setError("Failed to fetch RSL data");
          toast.error("Error loading RSL", {
            description: "There was an error loading the RSL document.",
          });
        }
      } catch (error) {
        console.error("Error fetching RSL:", error);
        setError("Network error");
        toast.error("Network error", {
          description: "Unable to connect to the server.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRslData();
  }, [rslId]);

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
        // Edit mode - merge new links with existing ones
        const newLinks = apiResult.links.map((link: any) => ({
          ...link,
          isNew: true, // Mark new links
        }));

        // Combine existing and new links, avoiding duplicates
        const existingUrls = new Set(crawledLinks.map(link => link.url));
        const uniqueNewLinks = newLinks.filter((link: CrawledLink) => !existingUrls.has(link.url));

        setCrawledLinks(prev => [...prev, ...uniqueNewLinks]);
        setCrawlSummary(apiResult.summary);

        if (uniqueNewLinks.length > 0) {
          toast.success(`Added ${uniqueNewLinks.length} new links to your RSL`, {
            description: apiResult.summary.message,
          });
        } else {
          toast.info("No new links found", {
            description: "All discovered links are already in your RSL.",
          });
        }

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

  const handleUpdateRsl = async () => {
    if (!url) {
      toast.error("Missing website URL", {
        description: "Please enter a website URL before updating RSL.",
      });
      return;
    }

    setIsGeneratingXml(true);

    try {
      // Generate XML
      const xml = generateRslXmlFromLinks();
      
      // Save RSL immediately
      const response = await fetch(`/api/rsl/${rslId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: `${protocol}://${url}`,
          xmlContent: xml,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("RSL updated successfully!", {
            description: `Your RSL document for ${protocol}://${url} has been updated.`,
          });
          // Redirect to view page after successful update
          router.push(`/dashboard/rsl/${rslId}`);
        } else {
          toast.error("Failed to update RSL", {
            description: "There was an error updating your RSL document. Please try again.",
          });
        }
      } else {
        toast.error("Something went wrong", {
          description: `HTTP error ${response.status}. Please try again.`,
        });
      }
    } catch (error) {
      console.error("Error updating RSL:", error);
      toast.error("Network error", {
        description:
          "Unable to connect to the server. Please check your connection and try again.",
      });
    } finally {
      setIsGeneratingXml(false);
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


  // Loading state
  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="Edit RSL"
          text="Loading your RSL configuration for editing."
        />
        <div className="flex max-w-full overflow-hidden lg:flex-row flex-col gap-6">
          <div className="lg:w-3/5 w-full min-w-0 flex-1 overflow-hidden">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-full animate-pulse rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="sticky top-0 lg:h-screen h-auto lg:w-2/5 w-full min-w-0 overflow-y-auto lg:pl-6 p-0 bg-muted/30 dark:bg-muted/10">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader>
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !rsl) {
    return (
      <>
        <DashboardHeader
          heading="Edit RSL"
          text="Unable to load RSL for editing."
        />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Icons.warning className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Error loading RSL</h3>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <Icons.arrowRight className="mr-2 size-4" />
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }



  // Main form state (same as create page but for editing)
  return (
    <>
      <DashboardHeader
        heading="Edit RSL"
        text="Refetch links or modify existing RSL configuration and licensing terms."
      >
        <div className="flex gap-2">
          <Link href={`/dashboard/rsl/${rslId}`}>
            <Button variant="outline">
              <Icons.arrowLeft className="mr-2 size-4" />
              Back to View
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="flex max-w-full overflow-hidden lg:flex-row flex-col gap-6">
        <div className="lg:w-3/5 w-full min-w-0 flex-1 overflow-hidden">
          <div className="space-y-6">
            <AddLinksSection
              mode="edit"
              url={url}
              protocol={protocol}
              isCrawling={isCrawling}
              onUrlChange={setUrl}
              onProtocolChange={setProtocol}
              onFetchLinks={handleFetchLinks}
            />

            {/* Link Sources Section - show existing and new links */}
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
                mode="edit"
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
                    {crawlSummary ? 'Refetched' : 'Loaded'}
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
                      width: crawlSummary ? '100%' : '100%' // Always show as loaded for existing RSL
                    }}
                  />
                </div>
              </div>

              {/* RSL Configuration Summary */}
              {showCrawledLinks && (
                <RslConfigSummary 
                  crawledLinks={crawledLinks} 
                  mode="edit" 
                />
              )}

              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleUpdateRsl}
                  disabled={isGeneratingXml}
                >
                  {isGeneratingXml ? (
                    <>
                      <Icons.spinner className="mr-2 size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update RSL"
                  )}
                </Button>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </>
  );
}