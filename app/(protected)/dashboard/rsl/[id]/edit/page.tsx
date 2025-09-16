"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/shared/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
import {
  generateRslXml,
  validateRslData,
  createNewLicense,
  getAvailableUsageTypes,
  getAvailablePaymentTypes,
  parseRslXmlToEditableContent,
  type RslContent,
  type RslLicense,
  type EditableContent,
} from "@/lib/rsl-generator";

interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent: string;
  createdAt: string;
  updatedAt: string;
}

// EditableContent interface moved to @/lib/rsl-generator.ts

export default function EditRSLPage() {
  const params = useParams();
  const router = useRouter();
  const [rsl, setRsl] = useState<RSL | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentList, setContentList] = useState<EditableContent[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [activeTab, setActiveTab] = useState("editor");

  const rslId = params.id as string;

  // Fetch RSL data and initialize edit state
  useEffect(() => {
    const fetchRslData = async () => {
      if (!rslId) return;
      
      try {
        const response = await fetch(`/api/rsl/${rslId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setRsl(result.data);
            setWebsiteUrl(result.data.websiteUrl);
            const editableContent = parseRslXmlToEditableContent(result.data.xmlContent, result.data.websiteUrl);
            setContentList(editableContent);
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

  // Save RSL changes
  const handleSave = async () => {
    if (!rsl || saving) return;

    setSaving(true);
    try {
      // Convert editable content to RSL format
      const rslContents: RslContent[] = contentList.map(content => ({
        url: content.url,
        rsl: {
          licenseServer: content.licenseServer,
          encrypted: content.encrypted,
          lastModified: content.lastModified,
          licenses: content.licenses,
          metadata: content.metadata
        }
      }));

      // Validate RSL data
      const validation = validateRslData(rslContents);
      if (!validation.isValid) {
        toast.error("Invalid RSL configuration", {
          description: validation.errors[0] || "Please check your configuration.",
        });
        return;
      }

      // Generate XML
      const xmlContent = generateRslXml(rslContents);

      // Save to API
      const response = await fetch(`/api/rsl/${rslId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl,
          xmlContent,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("RSL updated successfully", {
            description: "Your changes have been saved.",
          });
          // Update local state with new data
          setRsl(prev => prev ? { ...prev, websiteUrl, xmlContent, updatedAt: new Date().toISOString() } : null);
        } else {
          toast.error("Failed to save RSL", {
            description: "There was an error saving your changes.",
          });
        }
      } else {
        toast.error("Failed to save RSL", {
          description: "Server error occurred while saving.",
        });
      }
    } catch (error) {
      console.error("Error saving RSL:", error);
      toast.error("Network error", {
        description: "Unable to save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for editing content
  const updateContent = (index: number, updates: Partial<EditableContent>) => {
    setContentList(prev => prev.map((content, i) => 
      i === index ? { ...content, ...updates } : content
    ));
  };

  const addLicense = (contentIndex: number) => {
    setContentList(prev => prev.map((content, i) => 
      i === contentIndex 
        ? { ...content, licenses: [...content.licenses, createNewLicense(content.licenses.length)] }
        : content
    ));
  };

  const updateLicense = (contentIndex: number, licenseIndex: number, updates: Partial<RslLicense>) => {
    setContentList(prev => prev.map((content, i) => 
      i === contentIndex 
        ? { 
            ...content, 
            licenses: content.licenses.map((license, j) => 
              j === licenseIndex ? { ...license, ...updates } : license
            )
          }
        : content
    ));
  };

  const removeLicense = (contentIndex: number, licenseIndex: number) => {
    setContentList(prev => prev.map((content, i) => 
      i === contentIndex 
        ? { 
            ...content, 
            licenses: content.licenses.filter((_, j) => j !== licenseIndex)
          }
        : content
    ));
  };

  // Generate preview XML
  const generatePreviewXml = () => {
    const rslContents: RslContent[] = contentList.map(content => ({
      url: content.url,
      rsl: {
        licenseServer: content.licenseServer,
        encrypted: content.encrypted,
        lastModified: content.lastModified,
        licenses: content.licenses,
        metadata: content.metadata
      }
    }));
    return generateRslXml(rslContents);
  };

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="Edit RSL"
          text="Loading your RSL configuration for editing."
        >
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Icons.arrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </div>
        </DashboardHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Skeleton className="ml-auto h-10 w-32" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (error || !rsl) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">Error loading RSL</h3>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/dashboard/rsl')}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-black/90"
          >
            Back to RSL List
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader
        heading="Edit RSL"
        text="Modify your RSL configuration and licensing terms."
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/rsl/${rslId}`)}
          >
            <Icons.arrowLeft className="mr-2 size-4" />
            Back to View
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Icons.spinner className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icons.save className="mr-2 size-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">XML Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Configuration</CardTitle>
                  <CardDescription>
                    Basic settings for your RSL document.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website-url">Website URL</Label>
                    <Input
                      id="website-url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {contentList.map((content, contentIndex) => (
                <Card key={contentIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Content Configuration {contentList.length > 1 && `#${contentIndex + 1}`}
                    </CardTitle>
                    <CardDescription>
                      Configure licensing for this content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`content-url-${contentIndex}`}>Content URL</Label>
                        <Input
                          id={`content-url-${contentIndex}`}
                          value={content.url}
                          onChange={(e) => updateContent(contentIndex, { url: e.target.value })}
                          placeholder="https://example.com/content"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`license-server-${contentIndex}`}>License Server</Label>
                        <Input
                          id={`license-server-${contentIndex}`}
                          value={content.licenseServer}
                          onChange={(e) => updateContent(contentIndex, { licenseServer: e.target.value })}
                          placeholder="Optional license server URL"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`encrypted-${contentIndex}`}
                        checked={content.encrypted}
                        onCheckedChange={(checked) => updateContent(contentIndex, { encrypted: checked })}
                      />
                      <Label htmlFor={`encrypted-${contentIndex}`}>Encrypted content</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`last-modified-${contentIndex}`}>Last Modified</Label>
                      <Input
                        id={`last-modified-${contentIndex}`}
                        value={content.lastModified}
                        onChange={(e) => updateContent(contentIndex, { lastModified: e.target.value })}
                        placeholder="2024-01-01"
                        type="date"
                      />
                    </div>

                    {/* Metadata Section */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="flex w-full justify-between p-0">
                          <span className="font-medium">Metadata Settings</span>
                          <Icons.chevronDown className="size-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`schema-url-${contentIndex}`}>Schema URL</Label>
                            <Input
                              id={`schema-url-${contentIndex}`}
                              value={content.metadata.schemaUrl}
                              onChange={(e) => updateContent(contentIndex, { 
                                metadata: { ...content.metadata, schemaUrl: e.target.value }
                              })}
                              placeholder="https://schema.org/..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`copyright-type-${contentIndex}`}>Copyright Type</Label>
                            <Select
                              value={content.metadata.copyrightType}
                              onValueChange={(value: "person" | "organization") => 
                                updateContent(contentIndex, { 
                                  metadata: { ...content.metadata, copyrightType: value }
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="person">Person</SelectItem>
                                <SelectItem value="organization">Organization</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`contact-email-${contentIndex}`}>Contact Email</Label>
                            <Input
                              id={`contact-email-${contentIndex}`}
                              value={content.metadata.contactEmail}
                              onChange={(e) => updateContent(contentIndex, { 
                                metadata: { ...content.metadata, contactEmail: e.target.value }
                              })}
                              placeholder="contact@example.com"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`contact-url-${contentIndex}`}>Contact URL</Label>
                            <Input
                              id={`contact-url-${contentIndex}`}
                              value={content.metadata.contactUrl}
                              onChange={(e) => updateContent(contentIndex, { 
                                metadata: { ...content.metadata, contactUrl: e.target.value }
                              })}
                              placeholder="https://example.com/contact"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`terms-url-${contentIndex}`}>Terms URL</Label>
                            <Input
                              id={`terms-url-${contentIndex}`}
                              value={content.metadata.termsUrl}
                              onChange={(e) => updateContent(contentIndex, { 
                                metadata: { ...content.metadata, termsUrl: e.target.value }
                              })}
                              placeholder="https://example.com/terms"
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Licenses Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium">Licenses</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addLicense(contentIndex)}
                        >
                          <Icons.add className="mr-2 size-4" />
                          Add License
                        </Button>
                      </div>

                      {content.licenses.map((license, licenseIndex) => (
                        <Card key={license.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Input
                                value={license.name || ''}
                                onChange={(e) => updateLicense(contentIndex, licenseIndex, { name: e.target.value })}
                                placeholder="License name"
                                className="max-w-sm"
                              />
                              {content.licenses.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLicense(contentIndex, licenseIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Icons.trash className="size-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Permitted Usage</Label>
                                <div className="space-y-2">
                                  {getAvailableUsageTypes().map((usage) => (
                                    <div key={usage.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`permit-${contentIndex}-${licenseIndex}-${usage.id}`}
                                        checked={license.permits?.usage?.includes(usage.id) || false}
                                        onChange={(e) => {
                                          const currentUsage = license.permits?.usage || [];
                                          const newUsage = e.target.checked
                                            ? [...currentUsage, usage.id]
                                            : currentUsage.filter(u => u !== usage.id);
                                          updateLicense(contentIndex, licenseIndex, {
                                            permits: { ...license.permits, usage: newUsage }
                                          });
                                        }}
                                        className="rounded"
                                      />
                                      <Label 
                                        htmlFor={`permit-${contentIndex}-${licenseIndex}-${usage.id}`}
                                        className="text-sm"
                                      >
                                        {usage.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Payment Type</Label>
                                <Select
                                  value={license.payment?.type || 'free'}
                                  onValueChange={(value) => updateLicense(contentIndex, licenseIndex, {
                                    payment: { ...license.payment, type: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailablePaymentTypes().map((payment) => (
                                      <SelectItem key={payment.value} value={payment.value}>
                                        {payment.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {license.payment?.type !== 'free' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`amount-${contentIndex}-${licenseIndex}`}>Amount</Label>
                                  <Input
                                    id={`amount-${contentIndex}-${licenseIndex}`}
                                    value={license.payment?.amount || ''}
                                    onChange={(e) => updateLicense(contentIndex, licenseIndex, {
                                      payment: { ...license.payment, amount: e.target.value }
                                    })}
                                    placeholder="10.00"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`currency-${contentIndex}-${licenseIndex}`}>Currency</Label>
                                  <Input
                                    id={`currency-${contentIndex}-${licenseIndex}`}
                                    value={license.payment?.currency || ''}
                                    onChange={(e) => updateLicense(contentIndex, licenseIndex, {
                                      payment: { ...license.payment, currency: e.target.value }
                                    })}
                                    placeholder="USD"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>RSL XML Preview</CardTitle>
                  <CardDescription>
                    Preview of the generated RSL XML document.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HighlightedXml code={generatePreviewXml()} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>RSL Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(rsl.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(rsl.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Content Items</div>
                  <div className="text-sm text-muted-foreground">
                    {contentList.length} configured
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Use the Editor tab to modify licensing terms</p>
                <p>• Preview changes in the XML Preview tab</p>
                <p>• Save frequently to avoid losing changes</p>
                <p>• Each content item can have multiple license options</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
