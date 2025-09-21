"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/shared/icons";

interface AddLinksSectionProps {
  mode: "create" | "edit";
  url: string;
  protocol: string;
  isCrawling: boolean;
  onUrlChange: (url: string) => void;
  onProtocolChange: (protocol: string) => void;
  onFetchLinks: () => void;
}

export function AddLinksSection({
  mode,
  url,
  protocol,
  isCrawling,
  onUrlChange,
  onProtocolChange,
  onFetchLinks,
}: AddLinksSectionProps) {
  const isEditMode = mode === "edit";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditMode ? "Refetch links" : "Add links"}
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
                <Select value={protocol} onValueChange={onProtocolChange}>
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
                  onChange={(e) => onUrlChange(e.target.value)}
                  placeholder="www.example.com"
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                <Icons.help className="mt-0.5 size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isEditMode
                    ? "Refetching will discover new links and add them to your existing RSL configuration. Existing links will be preserved."
                    : "Links found during crawling or sitemap retrieval may be updated if new links are discovered or some links are invalid."
                  }
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sitemap" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sitemap-url">Sitemap URL</Label>
              <div className="flex">
                <Select value={protocol} onValueChange={onProtocolChange}>
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
                  onChange={(e) => onUrlChange(e.target.value)}
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
                <Select value={protocol} onValueChange={onProtocolChange}>
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
                  onChange={(e) => onUrlChange(e.target.value)}
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
            onClick={onFetchLinks}
            disabled={!url || isCrawling}
            className="w-32"
          >
            {isCrawling ? (
              <>
                <Icons.spinner className="mr-2 size-4 animate-spin" />
                {isEditMode ? "Refetching..." : "Crawling..."}
              </>
            ) : (
              isEditMode ? "Refetch links" : "Fetch links"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
