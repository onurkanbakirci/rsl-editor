"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Icons } from "@/components/shared/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";

// Types for crawled links with RSL data
interface CrawledLink {
  id: string;
  url: string;
  status: "crawling" | "completed" | "failed";
  isNew?: boolean;
  selected: boolean;
  formData?: {
    // RSL-specific fields only
    rsl?: {
      licenseServer?: string;
      encrypted?: boolean;
      lastModified?: string;
      // Multiple licenses per content (key insight from RSL spec)
      licenses?: Array<{
        id: string; // Unique identifier for this license
        name?: string; // User-friendly name for this license option
        permits?: {
          usage?: string[];
          user?: string[];
          geo?: string[];
        };
        prohibits?: {
          usage?: string[];
          user?: string[];
          geo?: string[];
        };
        payment?: {
          type?: "purchase" | "subscription" | "training" | "crawl" | "inference" | "attribution" | "free";
          standardUrls?: string[]; // Multiple standard URLs allowed
          customUrl?: string; // Only one custom URL
          amount?: string;
          currency?: string;
        };
        legal?: Array<{
          type: "warranty" | "disclaimer";
          terms: string[];
        }>;
      }>;
      metadata?: {
        schemaUrl?: string;
        copyrightType?: "person" | "organization";
        contactEmail?: string;
        contactUrl?: string;
        termsUrl?: string;
      };
    };
  };
}

// Mock URLs from the image
const mockDiscoveredUrls = [
  "https://cursor.com/cn/blog/openai-fund",
  "https://cursor.com/en/changelog/new-upstream", 
  "https://cursor.com/en/changelog/early-preview-hold-cmd-tap-shift-to-trigger-ai...",
  "https://cursor.com/cn/changelog/stable-indexing-v0-1",
  "https://cursor.com/cn/changelog/cursor-tab-python-auto-import-composer-imp...",
  "https://cursor.com/cn/changelog/v0-1-7-2023-03-25-",
  "https://cursor.com/cn/changelog/-0-4-2-hotfixes",
  "https://cursor.com/ja/changelog/release-for-linux"
];

// Mock data for demonstration
const mockCrawledLinks: CrawledLink[] = [
  {
    id: "1",
    url: "https://cursor.com/",
    status: "crawling",
    isNew: true,
    selected: false,
  },
];

export default function CreateRSLPage() {
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState("https");
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [linkCount, setLinkCount] = useState(901);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [showCrawledLinks, setShowCrawledLinks] = useState(false);
  const [selectedPageForm, setSelectedPageForm] = useState<string | null>(null);
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [activeLicenseTab, setActiveLicenseTab] = useState<Record<string, string>>({});

  const handleFetchLinks = async () => {
    if (!url) return;
    
    setIsCrawling(true);
    // Simulate crawling
    setTimeout(() => {
      const mainUrl = `${protocol}://${url}`;
      const mainUrlLink: CrawledLink = {
        id: "main",
        url: mainUrl,
        status: "completed",
        isNew: true,
        selected: false,
      };
      
      // Add discovered URLs as separate crawled links
      const discoveredLinks: CrawledLink[] = mockDiscoveredUrls.map((discoveredUrl, index) => ({
        id: `discovered-${index}`,
        url: discoveredUrl,
        status: "completed",
        isNew: true,
        selected: false,
      }));
      
      setCrawledLinks([mainUrlLink, ...discoveredLinks]);
      setIsCrawling(false);
      setShowCrawledLinks(true);
    }, 2000);
  };

  const toggleSelectAll = () => {
    const allSelected = crawledLinks.every(link => link.selected);
    setCrawledLinks(prev => prev.map(link => ({
      ...link,
      selected: !allSelected
    })));
  };

  const toggleLinkSelection = (linkUrl: string) => {
    setCrawledLinks(prev => prev.map(link => {
      if (link.url === linkUrl) {
        return { ...link, selected: !link.selected };
      }
      return link;
    }));
  };

  const updatePageFormData = (pageUrl: string, formData: Partial<CrawledLink['formData']>) => {
    setCrawledLinks(prev => prev.map(link =>
      link.url === pageUrl ? { 
        ...link, 
        formData: { ...link.formData, ...formData }
      } : link
    ));
  };

  const addLicense = (pageUrl: string) => {
    const newLicense = {
      id: `license-${Date.now()}`,
      name: `License Option ${(getCurrentLicenses(pageUrl).length + 1)}`,
      permits: { usage: [], user: [], geo: [] },
      prohibits: { usage: [], user: [], geo: [] },
      payment: { type: "free" as const },
      legal: []
    };
    
    const currentRsl = getCurrentRslData(pageUrl);
    const currentLicenses = currentRsl?.licenses || [];
    
    updatePageFormData(pageUrl, {
      rsl: {
        ...currentRsl,
        licenses: [...currentLicenses, newLicense]
      }
    });
    
    // Set the new license as active
    setActiveLicenseTab(prev => ({ ...prev, [pageUrl]: newLicense.id }));
  };

  const removeLicense = (pageUrl: string, licenseId: string) => {
    const currentRsl = getCurrentRslData(pageUrl);
    const currentLicenses = currentRsl?.licenses || [];
    const filteredLicenses = currentLicenses.filter(l => l.id !== licenseId);
    
    updatePageFormData(pageUrl, {
      rsl: {
        ...currentRsl,
        licenses: filteredLicenses
      }
    });
    
    // If we removed the active license, switch to the first one
    if (activeLicenseTab[pageUrl] === licenseId && filteredLicenses.length > 0) {
      setActiveLicenseTab(prev => ({ ...prev, [pageUrl]: filteredLicenses[0].id }));
    }
  };

  const getCurrentRslData = (pageUrl: string) => {
    return crawledLinks.find(l => l.url === pageUrl)?.formData?.rsl;
  };

  const getCurrentLicenses = (pageUrl: string) => {
    return getCurrentRslData(pageUrl)?.licenses || [];
  };

  const getCurrentLicense = (pageUrl: string) => {
    const licenses = getCurrentLicenses(pageUrl);
    const activeId = activeLicenseTab[pageUrl];
    return licenses.find(l => l.id === activeId) || licenses[0];
  };

  const updateCurrentLicense = (pageUrl: string, licenseData: any) => {
    const currentRsl = getCurrentRslData(pageUrl);
    const currentLicenses = getCurrentLicenses(pageUrl);
    const activeId = activeLicenseTab[pageUrl] || currentLicenses[0]?.id;
    
    const updatedLicenses = currentLicenses.map(license =>
      license.id === activeId ? { ...license, ...licenseData } : license
    );
    
    updatePageFormData(pageUrl, {
      rsl: {
        ...currentRsl,
        licenses: updatedLicenses
      }
    });
  };

  const toggleUrlExpanded = (url: string) => {
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

  const filteredLinks = crawledLinks.filter(link =>
    link.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Button>
            <Icons.help className="mr-2 size-4" />
            Learn more
          </Button>
        </div>
      </DashboardHeader>

      <div className="flex">
        <div className="flex-1 w-[60%] pr-6">
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
                    <TabsTrigger value="individual">Individual link</TabsTrigger>
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
                        <Icons.help className="size-4 mt-0.5 text-muted-foreground" />
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
                        <Icons.spinner className="size-4 mr-2 animate-spin" />
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
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCrawling ? (
                    <div className="text-center py-12">
                      <Icons.spinner className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-lg font-medium">Crawling website...</p>
                      <p className="text-muted-foreground">This may take a few moments</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={crawledLinks.every(link => link.selected)}
                            onCheckedChange={toggleSelectAll}
                          />
                          <span className="text-sm font-medium">Select all</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Sort by:</span>
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
                          <div key={link.id} className="border rounded-lg">
                            {/* URL Header */}
                            <div 
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleUrlExpanded(link.url)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox 
                                  checked={link.selected}
                                  onCheckedChange={() => toggleLinkSelection(link.url)}
                            onClick={(e) => e.stopPropagation()}
                          />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Icons.logo className="size-4 flex-shrink-0" />
                                  <span className="text-sm truncate max-w-full">{link.url}</span>
                                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200 text-xs flex-shrink-0">
                                New
                              </Badge>
                            </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Icons.chevronDown className={cn(
                                  "size-4 transition-transform text-muted-foreground", 
                                  expandedUrls.has(link.url) && "rotate-180"
                                )} />
                            </div>
                          </div>
                          
                            {/* Form Section */}
                            {expandedUrls.has(link.url) && (
                              <div className="border-t bg-muted/30 p-4">
                                {link.selected ? (
                                  <div className="space-y-4">
                                    <div className="mb-4">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Icons.shield className="size-4" />
                                        RSL Configuration
                                      </h4>
                                    </div>

                                    <div className="space-y-6">
                                      {/* Content Settings Card */}
                                      <Card className="shadow-sm">
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-sm flex items-center gap-2">
                                            <Icons.settings className="size-4" />
                                            Content Settings
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                              <Label htmlFor={`license-server-${link.id}`}>License Server URL</Label>
                                              <Input 
                                                id={`license-server-${link.id}`}
                                                placeholder="https://license.example.com"
                                                value={getCurrentRslData(link.url)?.licenseServer || ""}
                                                onChange={(e) => updatePageFormData(link.url, { 
                                                  rsl: { 
                                                    ...getCurrentRslData(link.url),
                                                    licenseServer: e.target.value 
                                                  }
                                                })}
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
                                                      lastModified: rfc3339 
                                                    }
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
                                              onCheckedChange={(checked) => updatePageFormData(link.url, { 
                                                rsl: { 
                                                  ...getCurrentRslData(link.url),
                                                  encrypted: checked 
                                                }
                                              })}
                                            />
                                            <Label htmlFor={`encrypted-${link.id}`} className="text-sm">Content is encrypted</Label>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* License Management Card */}
                                      <Card className="shadow-sm">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                              <Icons.shield className="size-4" />
                                              License Management
                                            </CardTitle>
                                            {getCurrentLicenses(link.url).length > 0 && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addLicense(link.url)}
                                              >
                                                <Icons.add className="size-4 mr-1" />
                                                Add License
                                              </Button>
                                            )}
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          {(() => {
                                            const licenses = getCurrentLicenses(link.url);
                                            
                                            if (licenses.length === 0) {
                                              return (
                                                <div className="text-center py-8 px-4">
                                                  <Icons.shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                                  <h3 className="text-sm font-medium text-muted-foreground mb-2">No licenses configured</h3>
                                                  <p className="text-xs text-muted-foreground mb-4">Create your first license to define usage rights for this content.</p>
                                                  <Button onClick={() => addLicense(link.url)} size="sm">
                                                    <Icons.add className="size-4 mr-1" />
                                                    Create First License
                                                  </Button>
                                                </div>
                                              );
                                            }

                                            const currentLicense = getCurrentLicense(link.url);
                                            if (!currentLicense) return null;

                                            return (
                                              <div className="space-y-4">
                                                {/* License Tabs */}
                                                {licenses.length > 1 && (
                                                  <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                                                    {licenses.map((license) => (
                                                      <div key={license.id} className="flex items-center">
                                                        <Button
                                                          variant={activeLicenseTab[link.url] === license.id ? "default" : "ghost"}
                                                          size="sm"
                                                          onClick={() => setActiveLicenseTab(prev => ({ ...prev, [link.url]: license.id }))}
                                                          className="rounded-r-none h-8"
                                                        >
                                                          {license.name || `License ${licenses.indexOf(license) + 1}`}
                                                        </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                                                          onClick={() => removeLicense(link.url, license.id)}
                                                          className="rounded-l-none border-l px-2 h-8 hover:bg-destructive hover:text-destructive-foreground"
                                                          disabled={licenses.length === 1}
                                                        >
                                                          <Icons.trash className="size-3" />
                            </Button>
                          </div>
                                                    ))}
                        </div>
                                                )}

                                                {/* License Form */}
                                                <div className="space-y-6 p-4 border rounded-lg bg-background">
                                                  {/* Basic License Info */}
                            <div className="space-y-4">
                                                    <div className="flex items-center gap-2 pb-2 border-b">
                                                      <Icons.edit className="size-4" />
                                                      <h4 className="font-medium text-sm">Basic Information</h4>
                                                    </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                                        <Label htmlFor={`license-name-${link.id}`} className="text-sm font-medium">License Name</Label>
                                  <Input 
                                                          id={`license-name-${link.id}`}
                                                          placeholder="e.g., Commercial License"
                                                          value={currentLicense.name || ""}
                                                          onChange={(e) => updateCurrentLicense(link.url, { name: e.target.value })}
                                                          className="h-9"
                                  />
                                </div>
                                <div className="space-y-2">
                                                        <Label htmlFor={`payment-type-${link.id}`} className="text-sm font-medium">Payment Type</Label>
                                  <Select 
                                                          value={currentLicense.payment?.type || "free"}
                                                          onValueChange={(value: any) => updateCurrentLicense(link.url, { 
                                                            payment: { ...currentLicense.payment, type: value }
                                                          })}
                                                        >
                                                          <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Select payment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                                            <SelectItem value="free">🆓 Free</SelectItem>
                                                            <SelectItem value="purchase">💰 Purchase</SelectItem>
                                                            <SelectItem value="subscription">🔄 Subscription</SelectItem>
                                                            <SelectItem value="training">🎯 Training</SelectItem>
                                                            <SelectItem value="crawl">🕷️ Crawl</SelectItem>
                                                            <SelectItem value="inference">🧠 Inference</SelectItem>
                                                            <SelectItem value="attribution">📝 Attribution</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              </div>

                                                  {/* Usage Permissions */}
                                                  <div className="space-y-4">
                                                    <div className="flex items-center gap-2 pb-2 border-b">
                                                      <Icons.check className="size-4 text-green-600" />
                                                      <h4 className="font-medium text-sm">Permitted Usage</h4>
                              </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                      {[
                                                        { id: "all", label: "All Usage", icon: "🌟" },
                                                        { id: "train-ai", label: "Train AI", icon: "🤖" },
                                                        { id: "train-genai", label: "Train GenAI", icon: "✨" },
                                                        { id: "ai-use", label: "AI Use", icon: "🧠" },
                                                        { id: "ai-summarize", label: "AI Summarize", icon: "📄" },
                                                        { id: "search", label: "Search", icon: "🔍" }
                                                      ].map((usage) => (
                                                        <div key={usage.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                          <Checkbox 
                                                            id={`permit-${usage.id}-${link.id}-${currentLicense.id}`}
                                                            checked={currentLicense.permits?.usage?.includes(usage.id) || false}
                                                            onCheckedChange={(checked) => {
                                                              const currentUsage = currentLicense.permits?.usage || [];
                                                              const newUsage = checked 
                                                                ? [...currentUsage, usage.id]
                                                                : currentUsage.filter(u => u !== usage.id);
                                                              updateCurrentLicense(link.url, { 
                                                                permits: { 
                                                                  ...currentLicense.permits, 
                                                                  usage: newUsage 
                                                                }
                                                              });
                                                            }}
                                                          />
                                                          <Label htmlFor={`permit-${usage.id}-${link.id}-${currentLicense.id}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                                            <span>{usage.icon}</span>
                                                            {usage.label}
                                                          </Label>
                                </div>
                                                      ))}
                              </div>
                            </div>
                          </div>
                      </div>
                                            );
                                          })()}
                                        </CardContent>
                                      </Card>
                          </div>
                                  </div>
                                ) : (
                                  <div className="p-4 text-center text-muted-foreground">
                                    <Icons.shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">
                                      Select this URL to configure RSL licensing properties.
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
        <div className="w-[40%] p-6 sticky top-0 h-screen overflow-y-auto" style={{backgroundColor: 'rgb(244, 244, 245)'}}>
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icons.logo className="size-4" />
                  <span className="font-medium">{linkCount} Links</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">TBD</span>
                  <Icons.help className="size-3 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total size</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">TBD / 400 KB</span>
                    <Icons.help className="size-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full w-0 rounded-full bg-primary" />
                </div>
              </div>

              {/* RSL Configuration Summary */}
              {showCrawledLinks && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icons.shield className="size-4" />
                    <span className="text-sm font-medium">RSL Configuration</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    {(() => {
                      const selectedLinks = crawledLinks.filter(link => link.selected);
                      const configuredLinks = selectedLinks.filter(link => 
                        link.formData?.rsl && 
                        (link.formData.rsl.licenses?.length || 0) > 0
                      );
                      
                      return (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">URLs selected:</span>
                            <span className="font-medium">{selectedLinks.length}</span>
                              </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">URLs configured:</span>
                            <span className="font-medium">{configuredLinks.length}</span>
                            </div>
                          
                          {configuredLinks.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Total licenses:</span>
                              <span className="font-medium">
                                {configuredLinks.reduce((total, link) => 
                                  total + (link.formData?.rsl?.licenses?.length || 0), 0
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
              
              <Button className="w-full bg-black text-white hover:bg-black/90" size="lg">
                Create RSL
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Limit Modal */}
      <Dialog open={showPlanLimitModal} onOpenChange={setShowPlanLimitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Icons.warning className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Plan limit reached!</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              You've reached the total free limit of 10 links. You can delete some links to add new ones or upgrade your plan
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
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
