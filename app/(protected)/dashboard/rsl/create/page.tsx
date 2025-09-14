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
import { Icons } from "@/components/shared/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Types for crawled links
interface CrawledLink {
  id: string;
  url: string;
  status: "crawling" | "completed" | "failed";
  isNew?: boolean;
  selected: boolean;
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
    selected: true,
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

  const handleFetchLinks = async () => {
    // Show plan limit modal instead of actually crawling
    setShowPlanLimitModal(true);
  };

  const toggleSelectAll = () => {
    const allSelected = crawledLinks.every(link => link.selected);
    setCrawledLinks(prev => prev.map(link => ({
      ...link,
      selected: !allSelected
    })));
  };

  const toggleLinkSelection = (linkId: string) => {
    setCrawledLinks(prev => prev.map(link =>
      link.id === linkId ? { ...link, selected: !link.selected } : link
    ));
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
        <div className="flex-1 w-[60%] pr-0">
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
                    disabled={!url}
                    className="w-32"
                  >
                    Fetch links
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Link Sources Section - always visible */}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox />
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

                {/* Main cursor.com link - always visible and fully clickable */}
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsLinksExpanded(!isLinksExpanded)}
                >
                  <Checkbox 
                    checked 
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icons.logo className="size-4" />
                      <span className="text-sm font-medium">https://cursor.com/</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200">
                        New
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last crawled Just now • Links: 901
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icons.ellipsis className="size-4" />
                    </Button>
                    <Icons.chevronDown className={cn("size-4 transition-transform text-muted-foreground", isLinksExpanded && "rotate-180")} />
                  </div>
                </div>

                {/* Expanded content - list of discovered URLs */}
                {isLinksExpanded && (
                  <div className="pl-4 space-y-3">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      901 LINKS INCLUDED
                    </div>
                    
                    <div className="space-y-2">
                      {mockDiscoveredUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm truncate">{url}</span>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200 text-xs">
                              New
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Icons.ellipsis className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Icons.chevronRight className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
