"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  generateRslXml,
  createNewLicense,
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

export function CreateRslForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState<"http" | "https">("https");
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("url");
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [activeLicenseTab, setActiveLicenseTab] = useState<Record<string, string>>({});

  const [isGeneratingXml, setIsGeneratingXml] = useState(false);

  const handleFetchLinks = async () => {
    if (!url) {
      toast.error("Please enter a URL first");
      return;
    }

    setIsCrawling(true);
    
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${protocol}://${url}`,
          crawlType: 'crawl',
          options: {
            maxPages: 50,
            maxDepth: 2,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to crawl website');
      }

      const result = await response.json();
      
      if (result.success && result.links) {
        // Convert crawled links to our format with RSL data
        const newLinks: CrawledLink[] = result.links.map((link: any) => ({
          ...link,
          selected: true, // Auto-select crawled links
          formData: {
            rsl: {
              licenseServer: "",
              encrypted: false,
              lastModified: "",
              licenses: [createNewLicense()],
              metadata: {
                schemaUrl: "",
                copyrightHolder: "",
                copyrightType: "person",
                contactEmail: "",
                contactUrl: "",
                termsUrl: "",
              },
            },
          },
        }));

        setCrawledLinks(prev => [...prev, ...newLinks]);
        toast.success(`Found ${newLinks.length} pages`, {
          description: "Pages have been added to your RSL configuration.",
        });
      } else {
        toast.error("No pages found", {
          description: result.errors?.[0] || "Unable to crawl the website.",
        });
      }
    } catch (error) {
      console.error('Crawling error:', error);
      toast.error("Failed to crawl website", {
        description: "Please check the URL and try again.",
      });
    } finally {
      setIsCrawling(false);
    }
  };

  const handleProtocolChange = (newProtocol: string) => {
    setProtocol(newProtocol as "http" | "https");
  };

  const generateRslXmlFromLinks = (): string => {
    const selectedLinks = crawledLinks.filter(link => link.selected && link.formData?.rsl);
    
    if (selectedLinks.length === 0) {
      return generateRslXml([]);
    }

    const rslContents: RslContent[] = selectedLinks.map(link => ({
      url: link.url,
      rsl: link.formData!.rsl!,
    }));

    return generateRslXml(rslContents);
  };

  const handleCreateRsl = async () => {
    if (!url) {
      toast.error("Missing website URL", {
        description: "Please enter a website URL before creating RSL.",
      });
      return;
    }

    setIsGeneratingXml(true);

    try {
      // Generate XML
      const xml = generateRslXmlFromLinks();
      
      // Save RSL
      const response = await fetch("/api/rsl", {
        method: "POST",
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
          toast.success("RSL created successfully!", {
            description: `Your RSL document for ${protocol}://${url} has been created.`,
          });
          // Redirect to the view page
          router.push(`/dashboard/rsl/${result.data.id}`);
        } else {
          toast.error("Failed to create RSL", {
            description: "There was an error creating your RSL document. Please try again.",
          });
        }
      } else {
        toast.error("Something went wrong", {
          description: `HTTP error ${response.status}. Please try again.`,
        });
      }
    } catch (error) {
      console.error("Error creating RSL:", error);
      toast.error("Network error", {
        description:
          "Unable to connect to the server. Please check your connection and try again.",
      });
    } finally {
      setIsGeneratingXml(false);
    }
  };

  const handleToggleSelectAll = () => {
    const allSelected = crawledLinks.every(link => link.selected);
    setCrawledLinks(prev => 
      prev.map(link => ({ ...link, selected: !allSelected }))
    );
  };

  const handleToggleLinkSelection = (linkUrl: string) => {
    setCrawledLinks(prev =>
      prev.map(link =>
        link.url === linkUrl ? { ...link, selected: !link.selected } : link
      )
    );
  };

  const handleToggleUrlExpanded = (url: string) => {
    setExpandedUrls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const handleUpdatePageFormData = (pageUrl: string, formData: Partial<CrawledLink["formData"]>) => {
    setCrawledLinks(prev =>
      prev.map(link =>
        link.url === pageUrl
          ? {
              ...link,
              formData: {
                ...link.formData,
                ...formData,
              },
            }
          : link
      )
    );
  };

  const handleAddLicense = (pageUrl: string) => {
    setCrawledLinks(prev =>
      prev.map(link =>
        link.url === pageUrl && link.formData?.rsl
          ? {
              ...link,
              formData: {
                ...link.formData,
                rsl: {
                  ...link.formData.rsl,
                  licenses: [...(link.formData.rsl.licenses || []), createNewLicense()],
                },
              },
            }
          : link
      )
    );
  };

  const handleRemoveLicense = (pageUrl: string, licenseId: string) => {
    setCrawledLinks(prev =>
      prev.map(link =>
        link.url === pageUrl && link.formData?.rsl
          ? {
              ...link,
              formData: {
                ...link.formData,
                rsl: {
                  ...link.formData.rsl,
                  licenses: link.formData.rsl.licenses?.filter(license => license.id !== licenseId) || [],
                },
              },
            }
          : link
      )
    );
  };

  const handleSetActiveLicenseTab = (tabs: Record<string, string>) => {
    setActiveLicenseTab(tabs);
  };

  const handleRemoveLink = (linkId: string) => {
    setCrawledLinks(prev => prev.filter(link => link.id !== linkId));
    toast.success("Link removed", {
      description: "The link has been removed from your RSL configuration.",
    });
  };

  const handleToggleLink = (linkId: string) => {
    setCrawledLinks(prev =>
      prev.map(link =>
        link.id === linkId ? { ...link, selected: !link.selected } : link
      )
    );
  };

  const handleUpdateLinkData = (linkId: string, newData: any) => {
    setCrawledLinks(prev =>
      prev.map(link =>
        link.id === linkId
          ? {
              ...link,
              formData: {
                ...link.formData,
                rsl: {
                  ...link.formData?.rsl,
                  ...newData,
                },
              },
            }
          : link
      )
    );
  };

  const selectedLinksCount = crawledLinks.filter(link => link.selected).length;

  return (
    <>
      <DashboardHeader
        heading="Create RSL"
        text="Generate RSL documents for your website content with custom licensing terms."
      >
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <Icons.arrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Add Links Section */}
          <AddLinksSection 
            mode="create"
            url={url}
            protocol={protocol}
            isCrawling={isCrawling}
            onUrlChange={setUrl}
            onProtocolChange={handleProtocolChange}
            onFetchLinks={handleFetchLinks}
          />

          {/* Link Sources */}
          <LinkSources
            crawledLinks={crawledLinks}
            isCrawling={isCrawling}
            searchTerm={searchTerm}
            sortBy={sortBy}
            expandedUrls={expandedUrls}
            activeLicenseTab={activeLicenseTab}
            onSearchTermChange={setSearchTerm}
            onSortByChange={setSortBy}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleLinkSelection={handleToggleLinkSelection}
            onToggleUrlExpanded={handleToggleUrlExpanded}
            onUpdatePageFormData={handleUpdatePageFormData}
            onAddLicense={handleAddLicense}
            onRemoveLicense={handleRemoveLicense}
            onSetActiveLicenseTab={handleSetActiveLicenseTab}
            mode="create"
          />
        </div>

        <div className="space-y-6">
          {/* Configuration Summary */}
          <RslConfigSummary
            crawledLinks={crawledLinks}
            mode="create"
          />

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Create RSL</CardTitle>
              <CardDescription>
                Generate your RSL document with the current configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!url && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                  <div className="flex">
                    <Icons.warning className="size-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Website URL required
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <p>
                          Please enter a website URL to create your RSL document.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedLinksCount === 0 && url && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex">
                    <Icons.info className="size-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        No content selected
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <p>
                          You can create an RSL document without specific content, or add links above to include specific pages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
                    Creating...
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
