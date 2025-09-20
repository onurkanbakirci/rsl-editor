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
// Remove all crawling-related imports - everything is handled server-side now
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { DashboardHeader } from "@/components/dashboard/header";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
import { Icons } from "@/components/shared/icons";

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

  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
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

  const filteredLinks = crawledLinks.filter((link) =>
    link.url.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
          <div className="lg:w-3/5 w-full min-w-0 flex-1 lg:pr-6 overflow-hidden">
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
            </div>
          </div>

          {/* Right Sidebar - Actions */}
          <div
            className="sticky top-0 lg:h-screen h-auto lg:w-2/5 w-full overflow-y-auto lg:p-6 p-0 bg-muted/30 dark:bg-muted/20"
          >
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
                      className="ml-2 max-w-[200px] truncate font-medium"
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
                      {crawledLinks.filter((link) => link.selected).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total licenses:
                    </span>
                    <span className="font-medium">
                      {crawledLinks
                        .filter((link) => link.selected && link.formData?.rsl)
                        .reduce(
                          (total, link) =>
                            total + (link.formData?.rsl?.licenses?.length || 0),
                          0,
                        )}
                    </span>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Primary Actions
                  </h4>

                  <Button
                    onClick={handleSaveRsl}
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
                        Save RSL Document
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      const blob = new Blob([generatedXml], {
                        type: "application/xml",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "rsl-document.xml";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success("XML file downloaded");
                    }}
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
                    onClick={() => {
                      navigator.clipboard.writeText(generatedXml);
                      toast.success("XML copied to clipboard");
                    }}
                  >
                    <Icons.copy className="mr-2 size-4" />
                    Copy to Clipboard
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      const blob = new Blob([generatedXml], {
                        type: "application/xml",
                      });
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
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
                    Your RSL document has been generated successfully and is
                    ready to save or download.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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
        <div className="lg:w-3/5 w-full min-w-0 flex-1 lg:pr-6 overflow-hidden">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Add links
                  <Icons.chevronUp className="size-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="crawl" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="crawl">Crawl links</TabsTrigger>
                    <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
                    <TabsTrigger value="individual">
                      Individual link
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="crawl" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <div className="flex">
                        <Select value={protocol} onValueChange={setProtocol}>
                          <SelectTrigger className="w-32 rounded-r-none border-r-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="https">https://</SelectItem>
                            <SelectItem value="http">http://</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="www.example.com"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-start gap-2">
                        <Icons.help className="mt-0.5 size-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Links found during crawling or sitemap retrieval may be updated if new links are discovered or some links are invalid.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sitemap" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sitemap-url">Sitemap URL</Label>
                      <div className="flex">
                        <Select value={protocol} onValueChange={setProtocol}>
                          <SelectTrigger className="w-32 rounded-r-none border-r-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="https">https://</SelectItem>
                            <SelectItem value="http">http://</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="sitemap-url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="www.example.com/sitemap.xml"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="individual" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="individual-url">Individual URL</Label>
                      <div className="flex">
                        <Select value={protocol} onValueChange={setProtocol}>
                          <SelectTrigger className="w-32 rounded-r-none border-r-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="https">https://</SelectItem>
                            <SelectItem value="http">http://</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="individual-url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="www.example.com/page"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                    <Icons.chevronDown className="size-4" />
                    Advanced options
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="max-pages">Max pages to crawl</Label>
                        <Input id="max-pages" type="number" placeholder="100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depth">Crawl depth</Label>
                        <Input id="depth" type="number" placeholder="3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exclude">Exclude patterns</Label>
                      <Input id="exclude" placeholder="/admin*, /login*" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end">
                  <Button
                    onClick={handleFetchLinks}
                    disabled={!url || isCrawling}
                    className="w-32"
                  >
                    {isCrawling ? (
                      <>
                        <Icons.spinner className="mr-2 size-4 animate-spin" />
                        Crawling...
                      </>
                    ) : (
                      "Fetch links"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Link Sources Section - only show after crawling */}
            {(showCrawledLinks || isCrawling) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Link sources</CardTitle>
                    <div className="relative">
                      <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCrawling ? (
                    <div className="py-12 text-center">
                      <Icons.spinner className="mx-auto mb-4 size-8 animate-spin" />
                      <p className="text-lg font-medium">Crawling website...</p>
                      <p className="text-muted-foreground">
                        This may take a few moments
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={crawledLinks.every(
                              (link) => link.selected,
                            )}
                            onCheckedChange={toggleSelectAll}
                          />
                          <span className="text-sm font-medium">
                            Select all
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Sort by:
                          </span>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="status">Status</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* All discovered URLs */}
                      <div className="space-y-3">
                        {crawledLinks.map((link) => (
                          <div
                            key={link.id}
                            className="overflow-hidden rounded-lg border"
                          >
                            {/* URL Header */}
                            <div
                              className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-muted/50"
                              onClick={() => toggleUrlExpanded(link.url)}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Checkbox
                                  checked={link.selected}
                                  onCheckedChange={() =>
                                    toggleLinkSelection(link.url)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <span className="max-w-full truncate text-sm">
                                    {link.url}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="shrink-0 border-green-200 bg-green-500/10 text-xs text-green-700"
                                  >
                                    New
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Icons.chevronDown
                                  className={cn(
                                    "size-4 text-muted-foreground transition-transform",
                                    expandedUrls.has(link.url) && "rotate-180",
                                  )}
                                />
                              </div>
                            </div>

                            {/* Form Section */}
                            {expandedUrls.has(link.url) && (
                              <div className="border-t bg-muted/30 p-4">
                                {link.selected ? (
                                  <div className="space-y-4">
                                    {(() => {
                                      const licenses = getCurrentLicenses(link.url);
                                      const currentLicense = getCurrentLicense(link.url);

                                      return (
                                        <div className="space-y-4">
                                          {/* Tabbed Configuration Form */}
                                          <div className="rounded-lg border bg-background">
                                            <Tabs defaultValue="content-settings" className="w-full">
                                              <TabsList className="grid w-full grid-cols-3">
                                                <TabsTrigger value="content-settings">Content Settings</TabsTrigger>
                                                <TabsTrigger value="license-management">License Management</TabsTrigger>
                                                <TabsTrigger value="content-metadata">Content Metadata</TabsTrigger>
                                              </TabsList>

                                              {/* Content Settings Tab */}
                                              <TabsContent value="content-settings" className="p-4 space-y-6">
                                                {/* Content Settings Header */}
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <h3 className="text-lg font-medium">Content Settings</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                      Configure server settings and content metadata
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="space-y-4">
                                                  <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`license-server-${link.id}`}>License Server URL</Label>
                                                      <Input
                                                        id={`license-server-${link.id}`}
                                                        placeholder="https://license.example.com"
                                                        value={getCurrentRslData(link.url)?.licenseServer || ""}
                                                        onChange={(e) =>
                                                          updatePageFormData(link.url, {
                                                            rsl: {
                                                              ...getCurrentRslData(link.url),
                                                              licenseServer: e.target.value,
                                                            },
                                                          })
                                                        }
                                                      />
                                                    </div>
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`lastmod-${link.id}`}>Last Modified</Label>
                                                      <DatePicker
                                                        date={(() => {
                                                          const lastMod = getCurrentRslData(link.url)?.lastModified;
                                                          return lastMod ? new Date(lastMod) : undefined;
                                                        })()}
                                                        onDateChange={(date) => {
                                                          const rfc3339 = date ? date.toISOString() : "";
                                                          updatePageFormData(link.url, {
                                                            rsl: {
                                                              ...getCurrentRslData(link.url),
                                                              lastModified: rfc3339,
                                                            },
                                                          });
                                                        }}
                                                        placeholder="Select date"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <Switch
                                                      id={`encrypted-${link.id}`}
                                                      checked={getCurrentRslData(link.url)?.encrypted || false}
                                                      onCheckedChange={(checked) =>
                                                        updatePageFormData(link.url, {
                                                          rsl: {
                                                            ...getCurrentRslData(link.url),
                                                            encrypted: checked,
                                                          },
                                                        })
                                                      }
                                                    />
                                                    <Label htmlFor={`encrypted-${link.id}`} className="text-sm">
                                                      Content is encrypted
                                                    </Label>
                                                  </div>
                                                </div>
                                              </TabsContent>

                                              {/* License Management Tab */}
                                              <TabsContent value="license-management" className="p-4 space-y-6">
                                                {/* License Management Header */}
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <h3 className="text-lg font-medium">License Management</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                      Configure licensing options for this content
                                                    </p>
                                                  </div>
                                                  <div className="flex gap-2">
                                                    {licenses.length === 0 ? (
                                                      <Button
                                                        onClick={() => addLicense(link.url)}
                                                        size="sm"
                                                      >
                                                        <Icons.add className="mr-1 size-4" />
                                                        Create First License
                                                      </Button>
                                                    ) : (
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addLicense(link.url)}
                                                      >
                                                        <Icons.add className="mr-1 size-4" />
                                                        Add License
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* License Tabs - only show if there are multiple licenses */}
                                                {licenses.length > 1 && (
                                                  <div className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-2 border">
                                                    {licenses.map((license) => (
                                                      <div key={license.id} className="flex items-center">
                                                        <Button
                                                          variant={
                                                            activeLicenseTab[link.url] === license.id
                                                              ? "default"
                                                              : "ghost"
                                                          }
                                                          size="sm"
                                                          onClick={() =>
                                                            setActiveLicenseTab((prev) => ({
                                                              ...prev,
                                                              [link.url]: license.id,
                                                            }))
                                                          }
                                                          className={cn(
                                                            "h-8 rounded-r-none border",
                                                            activeLicenseTab[link.url] === license.id
                                                              ? "border-primary"
                                                              : "border-muted-foreground/20"
                                                          )}
                                                        >
                                                          {license.name || `License ${licenses.indexOf(license) + 1}`}
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => removeLicense(link.url, license.id)}
                                                          className="h-8 rounded-l-none border border-l-0 border-muted-foreground/20 px-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                                                          disabled={licenses.length === 1}
                                                        >
                                                          <Icons.trash className="size-3" />
                                                        </Button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                {licenses.length === 0 ? (
                                                  <div className="px-4 py-8 text-center">
                                                    <div className="mx-auto mb-4 size-12 rounded-full bg-muted flex items-center justify-center">
                                                      <Icons.scale className="size-6 text-muted-foreground" />
                                                    </div>
                                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                                      No licenses configured
                                                    </h3>
                                                    <p className="mb-4 text-xs text-muted-foreground">
                                                      Create your first license to define usage rights for this content.
                                                    </p>
                                                  </div>
                                                ) : (
                                                  <>
                                                    {/* Basic License Setup */}
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`license-name-${link.id}`}>License Name</Label>
                                                      <Input
                                                        id={`license-name-${link.id}`}
                                                        placeholder="e.g., Commercial License"
                                                        value={currentLicense.name || ""}
                                                        onChange={(e) =>
                                                          updateCurrentLicense(link.url, {
                                                            name: e.target.value,
                                                          })
                                                        }
                                                      />
                                                    </div>

                                                    <div className="space-y-2">
                                                      <Label htmlFor={`payment-type-${link.id}`}>Payment Type</Label>
                                                      <Select
                                                        value={currentLicense.payment?.type || "free"}
                                                        onValueChange={(value: any) =>
                                                          updateCurrentLicense(link.url, {
                                                            payment: {
                                                              ...currentLicense.payment,
                                                              type: value,
                                                            },
                                                          })
                                                        }
                                                      >
                                                        <SelectTrigger>
                                                          <SelectValue placeholder="Select payment type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {getAvailablePaymentTypes().map((paymentType) => (
                                                            <SelectItem key={paymentType.value} value={paymentType.value}>
                                                              {paymentType.label}
                                                            </SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>

                                                    {/* Payment Amount & Currency */}
                                                    {currentLicense.payment?.type !== "free" && currentLicense.payment?.type !== "attribution" && (
                                                      <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                          <Label htmlFor={`amount-${link.id}`}>
                                                            Amount <span className="text-red-500">*</span>
                                                          </Label>
                                                          <Input
                                                            id={`amount-${link.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0.00"
                                                            value={currentLicense.payment?.amount || ""}
                                                            onChange={(e) =>
                                                              updateCurrentLicense(link.url, {
                                                                payment: {
                                                                  ...currentLicense.payment,
                                                                  amount: e.target.value,
                                                                },
                                                              })
                                                            }
                                                            required
                                                          />
                                                        </div>
                                                        <div className="space-y-2">
                                                          <Label htmlFor={`currency-${link.id}`}>
                                                            Currency <span className="text-red-500">*</span>
                                                          </Label>
                                                          <Select
                                                            value={currentLicense.payment?.currency || "USD"}
                                                            onValueChange={(value) =>
                                                              updateCurrentLicense(link.url, {
                                                                payment: {
                                                                  ...currentLicense.payment,
                                                                  currency: value,
                                                                },
                                                              })
                                                            }
                                                          >
                                                            <SelectTrigger>
                                                              <SelectValue placeholder="Select currency" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              {getAvailableCurrencies().map((currency) => (
                                                                <SelectItem key={currency.id} value={currency.id}>
                                                                  {currency.label}
                                                                </SelectItem>
                                                              ))}
                                                            </SelectContent>
                                                          </Select>
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Usage Permissions */}
                                                    <div className="space-y-2">
                                                      <Label>Select permitted usage types</Label>
                                                      <MultiSelect
                                                        options={getAvailableUsageTypes().map(usage => ({
                                                          value: usage.id,
                                                          label: usage.label
                                                        }))}
                                                        defaultValue={currentLicense.permits?.usage || []}
                                                        onValueChange={(selectedUsage) => {
                                                          updateCurrentLicense(link.url, {
                                                            permits: {
                                                              ...currentLicense.permits,
                                                              usage: selectedUsage,
                                                            },
                                                          });
                                                        }}
                                                        placeholder="Select usage types..."
                                                      />
                                                    </div>

                                                    {/* User Types */}
                                                    <div className="space-y-2">
                                                      <Label>Select permitted user types</Label>
                                                      <MultiSelect
                                                        options={getAvailableUserTypes().map(userType => ({
                                                          value: userType.id,
                                                          label: userType.label
                                                        }))}
                                                        defaultValue={currentLicense.permits?.user || []}
                                                        onValueChange={(selectedUsers) => {
                                                          updateCurrentLicense(link.url, {
                                                            permits: {
                                                              ...currentLicense.permits,
                                                              user: selectedUsers,
                                                            },
                                                          });
                                                        }}
                                                        placeholder="Select user types..."
                                                      />
                                                    </div>

                                                    {/* Geographic Restrictions */}

                                                    <div className="space-y-2">
                                                      <Label>Restrict to specific countries (leave empty for worldwide)</Label>
                                                      <MultiSelect
                                                        options={getAvailableGeoCodes().map(geo => ({
                                                          value: geo.id,
                                                          label: geo.label,
                                                        }))}
                                                        defaultValue={currentLicense.permits?.geo || []}
                                                        onValueChange={(selectedGeo) => {
                                                          updateCurrentLicense(link.url, {
                                                            permits: {
                                                              ...currentLicense.permits,
                                                              geo: selectedGeo,
                                                            },
                                                          });
                                                        }}
                                                        placeholder="Select countries/regions..."
                                                      />
                                                    </div>

                                                    {/* Legal Warranties */}
                                                    <div className="space-y-2">
                                                      <Label>Legal Warranties</Label>
                                                      <MultiSelect
                                                        options={getAvailableWarrantyTypes().map(warranty => ({
                                                          value: warranty.id,
                                                          label: warranty.label
                                                        }))}
                                                        defaultValue={currentLicense.legal?.find(l => l.type === 'warranty')?.terms || []}
                                                        onValueChange={(selectedWarranties) => {
                                                          const updatedLegal = [...(currentLicense.legal || [])];
                                                          const warrantyIndex = updatedLegal.findIndex(l => l.type === 'warranty');

                                                          if (selectedWarranties.length > 0) {
                                                            if (warrantyIndex >= 0) {
                                                              updatedLegal[warrantyIndex] = { type: 'warranty', terms: selectedWarranties };
                                                            } else {
                                                              updatedLegal.push({ type: 'warranty', terms: selectedWarranties });
                                                            }
                                                          } else if (warrantyIndex >= 0) {
                                                            updatedLegal.splice(warrantyIndex, 1);
                                                          }

                                                          updateCurrentLicense(link.url, {
                                                            legal: updatedLegal,
                                                          });
                                                        }}
                                                        placeholder="Select warranties..."
                                                      />
                                                    </div>

                                                    {/* Legal Disclaimers */}
                                                    <div className="space-y-2">
                                                      <Label>Legal Disclaimers</Label>
                                                      <MultiSelect
                                                        options={getAvailableDisclaimerTypes().map(disclaimer => ({
                                                          value: disclaimer.id,
                                                          label: disclaimer.label
                                                        }))}
                                                        defaultValue={currentLicense.legal?.find(l => l.type === 'disclaimer')?.terms || []}
                                                        onValueChange={(selectedDisclaimers) => {
                                                          const updatedLegal = [...(currentLicense.legal || [])];
                                                          const disclaimerIndex = updatedLegal.findIndex(l => l.type === 'disclaimer');

                                                          if (selectedDisclaimers.length > 0) {
                                                            if (disclaimerIndex >= 0) {
                                                              updatedLegal[disclaimerIndex] = { type: 'disclaimer', terms: selectedDisclaimers };
                                                            } else {
                                                              updatedLegal.push({ type: 'disclaimer', terms: selectedDisclaimers });
                                                            }
                                                          } else if (disclaimerIndex >= 0) {
                                                            updatedLegal.splice(disclaimerIndex, 1);
                                                          }

                                                          updateCurrentLicense(link.url, {
                                                            legal: updatedLegal,
                                                          });
                                                        }}
                                                        placeholder="Select disclaimers..."
                                                      />
                                                    </div>
                                                  </>
                                                )}
                                              </TabsContent>

                                              {/* Content Metadata Tab */}
                                              <TabsContent value="content-metadata" className="p-4 space-y-6">
                                                {/* Content Metadata Header */}
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <h3 className="text-lg font-medium">Content Metadata</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                      Define content metadata and copyright information
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="space-y-4">
                                                  <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`schema-url-${link.id}`}>Schema.org URL</Label>
                                                      <Input
                                                        id={`schema-url-${link.id}`}
                                                        placeholder="https://schema.org/CreativeWork"
                                                        value={getCurrentRslData(link.url)?.metadata?.schemaUrl || ""}
                                                        onChange={(e) =>
                                                          updatePageFormData(link.url, {
                                                            rsl: {
                                                              ...getCurrentRslData(link.url),
                                                              metadata: {
                                                                ...getCurrentRslData(link.url)?.metadata,
                                                                schemaUrl: e.target.value,
                                                              },
                                                            },
                                                          })
                                                        }
                                                      />
                                                    </div>
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`terms-url-${link.id}`}>Terms URL</Label>
                                                      <Input
                                                        id={`terms-url-${link.id}`}
                                                        placeholder="https://example.com/terms"
                                                        value={getCurrentRslData(link.url)?.metadata?.termsUrl || ""}
                                                        onChange={(e) =>
                                                          updatePageFormData(link.url, {
                                                            rsl: {
                                                              ...getCurrentRslData(link.url),
                                                              metadata: {
                                                                ...getCurrentRslData(link.url)?.metadata,
                                                                termsUrl: e.target.value,
                                                              },
                                                            },
                                                          })
                                                        }
                                                      />
                                                    </div>
                                                  </div>

                                                  <div className="space-y-4">
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                      <div className="space-y-2">
                                                        <Label htmlFor={`copyright-holder-${link.id}`}>Copyright Holder</Label>
                                                        <Input
                                                          id={`copyright-holder-${link.id}`}
                                                          placeholder="John Doe or Example Corp"
                                                          value={getCurrentRslData(link.url)?.metadata?.copyrightHolder || ""}
                                                          onChange={(e) =>
                                                            updatePageFormData(link.url, {
                                                              rsl: {
                                                                ...getCurrentRslData(link.url),
                                                                metadata: {
                                                                  ...getCurrentRslData(link.url)?.metadata,
                                                                  copyrightHolder: e.target.value,
                                                                },
                                                              },
                                                            })
                                                          }
                                                        />
                                                      </div>
                                                      <div className="space-y-2">
                                                        <Label htmlFor={`copyright-type-${link.id}`}>Copyright Type</Label>
                                                        <Select
                                                          value={getCurrentRslData(link.url)?.metadata?.copyrightType || "person"}
                                                          onValueChange={(value: "person" | "organization") =>
                                                            updatePageFormData(link.url, {
                                                              rsl: {
                                                                ...getCurrentRslData(link.url),
                                                                metadata: {
                                                                  ...getCurrentRslData(link.url)?.metadata,
                                                                  copyrightType: value,
                                                                },
                                                              },
                                                            })
                                                          }
                                                        >
                                                          <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="person">Person</SelectItem>
                                                            <SelectItem value="organization">Organization</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                      </div>
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                      <div className="space-y-2">
                                                        <Label htmlFor={`contact-email-${link.id}`}>Contact Email</Label>
                                                        <Input
                                                          id={`contact-email-${link.id}`}
                                                          type="email"
                                                          placeholder="contact@example.com"
                                                          value={getCurrentRslData(link.url)?.metadata?.contactEmail || ""}
                                                          onChange={(e) =>
                                                            updatePageFormData(link.url, {
                                                              rsl: {
                                                                ...getCurrentRslData(link.url),
                                                                metadata: {
                                                                  ...getCurrentRslData(link.url)?.metadata,
                                                                  contactEmail: e.target.value,
                                                                },
                                                              },
                                                            })
                                                          }
                                                        />
                                                      </div>
                                                      <div className="space-y-2">
                                                        <Label htmlFor={`contact-url-${link.id}`}>Contact URL</Label>
                                                        <Input
                                                          id={`contact-url-${link.id}`}
                                                          placeholder="https://example.com/contact"
                                                          value={getCurrentRslData(link.url)?.metadata?.contactUrl || ""}
                                                          onChange={(e) =>
                                                            updatePageFormData(link.url, {
                                                              rsl: {
                                                                ...getCurrentRslData(link.url),
                                                                metadata: {
                                                                  ...getCurrentRslData(link.url)?.metadata,
                                                                  contactUrl: e.target.value,
                                                                },
                                                              },
                                                            })
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </TabsContent>
                                            </Tabs>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <div className="p-4 text-center text-muted-foreground">
                                    <p className="text-sm">
                                      Select this URL to configure RSL licensing
                                      properties.
                                    </p>
                                    <Button
                                      className="mt-3"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLinkSelection(link.url);
                                      }}
                                    >
                                      Select URL
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Sidebar - Sources */}
        <div
          className="sticky top-0 lg:h-screen h-auto lg:w-2/5 w-full overflow-y-auto lg:p-6 p-0 bg-muted/30 dark:bg-muted/20"
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      RSL Configuration
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {(() => {
                      const selectedLinks = crawledLinks.filter(
                        (link) => link.selected,
                      );
                      const configuredLinks = selectedLinks.filter(
                        (link) =>
                          link.formData?.rsl &&
                          (link.formData.rsl.licenses?.length || 0) > 0,
                      );

                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              URLs selected:
                            </span>
                            <span className="font-medium">
                              {selectedLinks.length}
                            </span>
                          </div>

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
                                {configuredLinks.reduce(
                                  (total, link) =>
                                    total +
                                    (link.formData?.rsl?.licenses?.length || 0),
                                  0,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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

      {/* Plan Limit Modal */}
      <Dialog open={showPlanLimitModal} onOpenChange={setShowPlanLimitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-100">
              <Icons.warning className="size-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Plan limit reached!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              You&apos;ve reached the total free limit of 10 links. You can
              delete some links to add new ones or upgrade your plan
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setShowPlanLimitModal(false)}
              className="px-8"
            >
              Upgrade plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
