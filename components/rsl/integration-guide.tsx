"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
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

interface IntegrationGuideProps {
  crawledLinks: CrawledLink[];
  websiteUrl: string;
  protocol?: string;
  generateRssContent: (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string) => string;
  generateRobotsContent: (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string) => string;
  generateWebPagesContent: (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string, type?: 'embedded' | 'linked') => string;
  generateMediaFilesContent: (crawledLinks: CrawledLink[], websiteUrl: string, protocol: string, type?: 'epub' | 'image') => string;
  // Optional flag to enable advanced features like nested tabs
  advanced?: boolean;
}

export function IntegrationGuide({
  crawledLinks,
  websiteUrl,
  protocol = "https",
  generateRssContent,
  generateRobotsContent,
  generateWebPagesContent,
  generateMediaFilesContent,
  advanced = false,
}: IntegrationGuideProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.code className="size-5" />
          Integration Guide
        </CardTitle>
        <CardDescription>
          Learn how to add your RSL document to different file formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rss" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rss">RSS Feeds</TabsTrigger>
            <TabsTrigger value="robots">robots.txt</TabsTrigger>
            <TabsTrigger value="webpages">Web Pages</TabsTrigger>
            <TabsTrigger value="mediafiles">Media Files</TabsTrigger>
          </TabsList>

          <TabsContent value="rss" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">RSS Feed Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Copy this ready-to-use RSS structure with your actual RSL licensing data. Just add the namespace declaration and include the RSL content blocks in your existing RSS feed.
                </p>
              </div>

              <div className="rounded-lg border bg-background">
                <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                  <span className="text-sm font-medium">Your RSS Feed with RSL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const rssContent = generateRssContent(crawledLinks, websiteUrl, protocol);
                      navigator.clipboard.writeText(rssContent);
                      toast.success("RSS code copied to clipboard");
                    }}
                  >
                    <Icons.copy className="size-4" />
                  </Button>
                </div>
                <div className="p-4 max-h-80 overflow-auto">
                  <HighlightedXml
                    code={generateRssContent(crawledLinks, websiteUrl, protocol)}
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="robots" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">robots.txt Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Add RSL licensing information to your robots.txt file. Just add the License directive pointing to your RSL document.
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Add License directive: <code className="bg-muted px-1 rounded text-xs">License: https://yourwebsite.com/license.xml</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Create your RSL license file at the specified URL</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-background">
                <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                  <span className="text-sm font-medium">Your robots.txt with RSL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const robotsContent = generateRobotsContent(crawledLinks, websiteUrl, protocol);
                      navigator.clipboard.writeText(robotsContent);
                      toast.success("robots.txt code copied to clipboard");
                    }}
                  >
                    <Icons.copy className="size-4" />
                  </Button>
                </div>
                <div className="p-4 max-h-80 overflow-auto">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {generateRobotsContent(crawledLinks, websiteUrl, protocol)}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webpages" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Web Pages Integration</h3>
                <p className="text-sm text-muted-foreground">
                  {advanced 
                    ? "Embed RSL licensing information directly in your web pages using script tags or linked files."
                    : "Add RSL licensing information directly to your web pages. Choose between embedding the license in a script tag or linking to an external license file."
                  }
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Embedded: <code className="bg-muted px-1 rounded text-xs">&lt;script type="application/rsl+xml"&gt;</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Linked: <code className="bg-muted px-1 rounded text-xs">&lt;link rel="license" type="application/rsl+xml"&gt;</code></span>
                  </div>
                </div>
              </div>

              {advanced ? (
                <Tabs defaultValue="embedded" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="embedded">Embedded Script</TabsTrigger>
                    <TabsTrigger value="linked">Linked File</TabsTrigger>
                  </TabsList>

                  <TabsContent value="embedded" className="space-y-4 mt-4">
                    <div className="rounded-lg border bg-background">
                      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                        <span className="text-sm font-medium">Embedded RSL Script</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const webPagesContent = generateWebPagesContent(crawledLinks, websiteUrl, protocol, 'embedded');
                            navigator.clipboard.writeText(webPagesContent);
                            toast.success("Web pages code copied to clipboard");
                          }}
                        >
                          <Icons.copy className="size-4" />
                        </Button>
                      </div>
                      <div className="p-4 max-h-80 overflow-auto">
                        <HighlightedXml code={generateWebPagesContent(crawledLinks, websiteUrl, protocol, 'embedded')} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="linked" className="space-y-4 mt-4">
                    <div className="rounded-lg border bg-background">
                      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                        <span className="text-sm font-medium">Linked RSL File</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const webPagesContent = generateWebPagesContent(crawledLinks, websiteUrl, protocol, 'linked');
                            navigator.clipboard.writeText(webPagesContent);
                            toast.success("Web pages code copied to clipboard");
                          }}
                        >
                          <Icons.copy className="size-4" />
                        </Button>
                      </div>
                      <div className="p-4 max-h-80 overflow-auto">
                        <HighlightedXml code={generateWebPagesContent(crawledLinks, websiteUrl, protocol, 'linked')} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="rounded-lg border bg-background">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                    <span className="text-sm font-medium">Your HTML Head with RSL</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const webPagesContent = generateWebPagesContent(crawledLinks, websiteUrl, protocol);
                        navigator.clipboard.writeText(webPagesContent);
                        toast.success("Web pages code copied to clipboard");
                      }}
                    >
                      <Icons.copy className="size-4" />
                    </Button>
                  </div>
                  <div className="p-4 max-h-80 overflow-auto">
                    <HighlightedXml
                      code={generateWebPagesContent(crawledLinks, websiteUrl, protocol)}
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mediafiles" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Media Files Integration</h3>
                <p className="text-sm text-muted-foreground">
                  {advanced 
                    ? "Embed RSL licensing information in EPUB files and image metadata for comprehensive media licensing."
                    : "Embed RSL licensing information directly in media files like images, eBooks, and other digital assets. This example shows EPUB integration."
                  }
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>{advanced ? "EPUB OPF metadata: " : "Images: XMP metadata with RSL namespace"}<code className="bg-muted px-1 rounded text-xs">{advanced ? '<meta property="rsl:license">' : 'rsl:License'}</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>{advanced ? "Image XMP metadata: " : "EPUB: OPF metadata with RSL license"}<code className="bg-muted px-1 rounded text-xs">{advanced ? 'rsl:License' : '<meta property="rsl:license">'}</code>{advanced ? " fields" : ""}</span>
                  </div>
                </div>
              </div>

              {advanced ? (
                <Tabs defaultValue="epub" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="epub">EPUB Files</TabsTrigger>
                    <TabsTrigger value="images">Image Files</TabsTrigger>
                  </TabsList>

                  <TabsContent value="epub" className="space-y-4 mt-4">
                    <div className="rounded-lg border bg-background">
                      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                        <span className="text-sm font-medium">EPUB OPF Metadata</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const mediaFilesContent = generateMediaFilesContent(crawledLinks, websiteUrl, protocol, 'epub');
                            navigator.clipboard.writeText(mediaFilesContent);
                            toast.success("EPUB metadata copied to clipboard");
                          }}
                        >
                          <Icons.copy className="size-4" />
                        </Button>
                      </div>
                      <div className="p-4 max-h-80 overflow-auto">
                        <HighlightedXml code={generateMediaFilesContent(crawledLinks, websiteUrl, protocol, 'epub')} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4 mt-4">
                    <div className="rounded-lg border bg-background">
                      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                        <span className="text-sm font-medium">Image XMP Metadata</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const mediaFilesContent = generateMediaFilesContent(crawledLinks, websiteUrl, protocol, 'image');
                            navigator.clipboard.writeText(mediaFilesContent);
                            toast.success("Image metadata copied to clipboard");
                          }}
                        >
                          <Icons.copy className="size-4" />
                        </Button>
                      </div>
                      <div className="p-4 max-h-80 overflow-auto">
                        <HighlightedXml code={generateMediaFilesContent(crawledLinks, websiteUrl, protocol, 'image')} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="rounded-lg border bg-background">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                    <span className="text-sm font-medium">Your EPUB Metadata with RSL</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const mediaFilesContent = generateMediaFilesContent(crawledLinks, websiteUrl, protocol);
                        navigator.clipboard.writeText(mediaFilesContent);
                        toast.success("Media files code copied to clipboard");
                      }}
                    >
                      <Icons.copy className="size-4" />
                    </Button>
                  </div>
                  <div className="p-4 max-h-80 overflow-auto">
                    <HighlightedXml
                      code={generateMediaFilesContent(crawledLinks, websiteUrl, protocol)}
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
