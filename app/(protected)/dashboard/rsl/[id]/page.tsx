"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { HighlightedXml } from "@/components/shared/highlighted-xml";
import { Icons } from "@/components/shared/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

// RSL data structure from API
interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent?: string;
  createdAt: string;
  updatedAt: string;
}

// Types for crawled links with RSL data (same as create page)
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

export default function RSLReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [rsl, setRsl] = useState<RSL | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showXmlView, setShowXmlView] = useState(true);
  
  // Create page state (same as create page)
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState("https");
  const [selectedPageForm, setSelectedPageForm] = useState<string | null>(null);
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [activeLicenseTab, setActiveLicenseTab] = useState<Record<string, string>>({});
  const [generatedXml, setGeneratedXml] = useState("");
  const [isGeneratingXml, setIsGeneratingXml] = useState(false);

  const rslId = params.id as string;

  // Parse XML content to extract configuration data
  const parseXmlToConfig = (xmlContent: string, websiteUrl: string): CrawledLink[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const contentElements = xmlDoc.getElementsByTagName('content');
      const links: CrawledLink[] = [];
      
      Array.from(contentElements).forEach((contentEl, index) => {
        const contentUrl = contentEl.getAttribute('url') || websiteUrl;
        const licenseServer = contentEl.getAttribute('server') || '';
        const encrypted = contentEl.getAttribute('encrypted') === 'true';
        const lastModified = contentEl.getAttribute('lastmod') || '';
        
        // Parse licenses
        const licenseElements = contentEl.getElementsByTagName('license');
        const licenses: any[] = [];
        
        Array.from(licenseElements).forEach((licenseEl, licenseIndex) => {
          const license: any = {
            id: `license-${Date.now()}-${licenseIndex}`,
            name: `License Option ${licenseIndex + 1}`,
            permits: { usage: [], user: [], geo: [] },
            prohibits: { usage: [], user: [], geo: [] },
            payment: { type: 'free' },
            legal: []
          };
          
          // Parse permits
          const permitElements = licenseEl.getElementsByTagName('permits');
          Array.from(permitElements).forEach(permitEl => {
            const type = permitEl.getAttribute('type');
            const values = permitEl.textContent?.split(',').map(v => v.trim()).filter(v => v) || [];
            if (type && license.permits[type]) {
              license.permits[type] = values;
            }
          });
          
          // Parse prohibits
          const prohibitElements = licenseEl.getElementsByTagName('prohibits');
          Array.from(prohibitElements).forEach(prohibitEl => {
            const type = prohibitEl.getAttribute('type');
            const values = prohibitEl.textContent?.split(',').map(v => v.trim()).filter(v => v) || [];
            if (type && license.prohibits[type]) {
              license.prohibits[type] = values;
            }
          });
          
          // Parse payment
          const paymentElements = licenseEl.getElementsByTagName('payment');
          if (paymentElements.length > 0) {
            const paymentEl = paymentElements[0];
            license.payment.type = paymentEl.getAttribute('type') || 'free';
            
            const standardElements = paymentEl.getElementsByTagName('standard');
            license.payment.standardUrls = Array.from(standardElements).map(el => el.textContent || '').filter(url => url);
            
            const customElements = paymentEl.getElementsByTagName('custom');
            if (customElements.length > 0) {
              license.payment.customUrl = customElements[0].textContent || '';
            }
            
            const amountElements = paymentEl.getElementsByTagName('amount');
            if (amountElements.length > 0) {
              const amountEl = amountElements[0];
              license.payment.amount = amountEl.textContent || '';
              license.payment.currency = amountEl.getAttribute('currency') || '';
            }
          }
          
          // Parse legal
          const legalElements = licenseEl.getElementsByTagName('legal');
          Array.from(legalElements).forEach(legalEl => {
            const type = legalEl.getAttribute('type');
            const terms = legalEl.textContent?.split(',').map(t => t.trim()).filter(t => t) || [];
            if (type && terms.length > 0) {
              license.legal.push({ type, terms });
            }
          });
          
          licenses.push(license);
        });
        
        // Parse metadata
        const metadata: any = {};
        const schemaElements = contentEl.getElementsByTagName('schema');
        if (schemaElements.length > 0) {
          metadata.schemaUrl = schemaElements[0].textContent || '';
        }
        
        const copyrightElements = contentEl.getElementsByTagName('copyright');
        if (copyrightElements.length > 0) {
          const copyrightEl = copyrightElements[0];
          metadata.copyrightType = copyrightEl.getAttribute('type') || '';
          metadata.contactEmail = copyrightEl.getAttribute('contactEmail') || '';
          metadata.contactUrl = copyrightEl.getAttribute('contactUrl') || '';
        }
        
        const termsElements = contentEl.getElementsByTagName('terms');
        if (termsElements.length > 0) {
          metadata.termsUrl = termsElements[0].textContent || '';
        }
        
        // Create crawled link object
        const link: CrawledLink = {
          id: `content-${index}`,
          url: contentUrl,
          status: 'completed',
          selected: true,
          formData: {
            rsl: {
              licenseServer,
              encrypted,
              lastModified,
              licenses,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined
            }
          }
        };
        
        links.push(link);
      });
      
      return links;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return [];
    }
  };

  // Helper functions (same as create page)
  const getWebsiteName = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
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

  const toggleLinkSelection = (linkUrl: string) => {
    setCrawledLinks(prev => prev.map(link => {
      if (link.url === linkUrl) {
        return { ...link, selected: !link.selected };
      }
      return link;
    }));
  };

  const toggleSelectAll = () => {
    const allSelected = crawledLinks.every(link => link.selected);
    setCrawledLinks(prev => prev.map(link => ({
      ...link,
      selected: !allSelected
    })));
  };

  // Fetch RSL data
  useEffect(() => {
    const fetchRslData = async () => {
      if (!rslId) return;
      
      try {
        const response = await fetch(`/api/rsl/${rslId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const rslData = result.data;
            setRsl(rslData);
            setGeneratedXml(rslData.xmlContent || '');
            
            // Parse website URL to extract protocol and domain
            try {
              const urlObj = new URL(rslData.websiteUrl);
              setProtocol(urlObj.protocol.replace(':', ''));
              setUrl(urlObj.host);
            } catch {
              setUrl(rslData.websiteUrl);
            }
            
            // Parse XML content to populate configuration
            if (rslData.xmlContent) {
              const parsedLinks = parseXmlToConfig(rslData.xmlContent, rslData.websiteUrl);
              setCrawledLinks(parsedLinks);
              
              // Set all URLs as expanded and set active license tabs
              const expandedSet = new Set(parsedLinks.map(link => link.url));
              setExpandedUrls(expandedSet);
              
              const activeTabs: Record<string, string> = {};
              parsedLinks.forEach(link => {
                const firstLicense = link.formData?.rsl?.licenses?.[0];
                if (firstLicense) {
                  activeTabs[link.url] = firstLicense.id;
                }
              });
              setActiveLicenseTab(activeTabs);
            }
          } else {
            toast.error("Failed to load RSL", {
              description: "The RSL document could not be found.",
            });
            router.push('/dashboard/rsl');
          }
        } else if (response.status === 404) {
          toast.error("RSL not found", {
            description: "The requested RSL document does not exist.",
          });
          router.push('/dashboard/rsl');
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching RSL:', error);
        toast.error("Failed to load RSL", {
          description: "There was an error loading the RSL document. Please try again.",
        });
        router.push('/dashboard/rsl');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRslData();
  }, [rslId, router]);

  // Generate RSL XML (same as create page)
  const generateRslXml = () => {
    const selectedLinks = crawledLinks.filter(link => link.selected && link.formData?.rsl);
    
    if (selectedLinks.length === 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<rsl xmlns="https://rslstandard.org/rsl">
  <!-- No content selected for licensing -->
</rsl>`;
    }

    const contentElements = selectedLinks.map(link => {
      const rslData = link.formData!.rsl!;
      const licenses = rslData.licenses || [];
      
      // Build content attributes
      let contentAttrs = `url="${link.url}"`;
      if (rslData.licenseServer) contentAttrs += ` server="${rslData.licenseServer}"`;
      if (rslData.encrypted) contentAttrs += ` encrypted="true"`;
      if (rslData.lastModified) contentAttrs += ` lastmod="${rslData.lastModified}"`;
      
      // Build license elements
      const licenseElements = licenses.map(license => {
        let licenseContent = '';
        
        // Permits
        if (license.permits?.usage?.length) {
          licenseContent += `    <permits type="usage">${license.permits.usage.join(',')}</permits>\n`;
        }
        if (license.permits?.user?.length) {
          licenseContent += `    <permits type="user">${license.permits.user.join(',')}</permits>\n`;
        }
        if (license.permits?.geo?.length) {
          licenseContent += `    <permits type="geo">${license.permits.geo.join(',')}</permits>\n`;
        }
        
        // Prohibits
        if (license.prohibits?.usage?.length) {
          licenseContent += `    <prohibits type="usage">${license.prohibits.usage.join(',')}</prohibits>\n`;
        }
        if (license.prohibits?.user?.length) {
          licenseContent += `    <prohibits type="user">${license.prohibits.user.join(',')}</prohibits>\n`;
        }
        if (license.prohibits?.geo?.length) {
          licenseContent += `    <prohibits type="geo">${license.prohibits.geo.join(',')}</prohibits>\n`;
        }
        
        // Payment
        if (license.payment?.type) {
          let paymentContent = '';
          if (license.payment.standardUrls?.length) {
            paymentContent += license.payment.standardUrls.map(url => `      <standard>${url}</standard>`).join('\n') + '\n';
          }
          if (license.payment.customUrl) {
            paymentContent += `      <custom>${license.payment.customUrl}</custom>\n`;
          }
          if (license.payment.amount && license.payment.currency) {
            paymentContent += `      <amount currency="${license.payment.currency}">${license.payment.amount}</amount>\n`;
          }
          
          if (paymentContent) {
            licenseContent += `    <payment type="${license.payment.type}">\n${paymentContent}    </payment>\n`;
          } else {
            licenseContent += `    <payment type="${license.payment.type}"/>\n`;
          }
        }
        
        // Legal
        if (license.legal?.length) {
          license.legal.forEach(legal => {
            if (legal.terms.length) {
              licenseContent += `    <legal type="${legal.type}">${legal.terms.join(',')}</legal>\n`;
            }
          });
        }
        
        return `  <license>\n${licenseContent}  </license>`;
      }).join('\n');
      
      // Build metadata elements
      let metadataElements = '';
      if (rslData.metadata?.schemaUrl) {
        metadataElements += `  <schema>${rslData.metadata.schemaUrl}</schema>\n`;
      }
      if (rslData.metadata?.copyrightType || rslData.metadata?.contactEmail || rslData.metadata?.contactUrl) {
        let copyrightAttrs = '';
        if (rslData.metadata.copyrightType) copyrightAttrs += ` type="${rslData.metadata.copyrightType}"`;
        if (rslData.metadata.contactEmail) copyrightAttrs += ` contactEmail="${rslData.metadata.contactEmail}"`;
        if (rslData.metadata.contactUrl) copyrightAttrs += ` contactUrl="${rslData.metadata.contactUrl}"`;
        metadataElements += `  <copyright${copyrightAttrs}/>\n`;
      }
      if (rslData.metadata?.termsUrl) {
        metadataElements += `  <terms>${rslData.metadata.termsUrl}</terms>\n`;
      }
      
      return `  <content ${contentAttrs}>
${licenseElements}
${metadataElements}  </content>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rsl xmlns="https://rslstandard.org/rsl">
${contentElements}
</rsl>`;
  };

  const handleUpdateRsl = async () => {
    setIsGeneratingXml(true);
    
    // Simulate loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const xml = generateRslXml();
    setGeneratedXml(xml);
    setIsGeneratingXml(false);
    setShowXmlView(true);
  };

  const handleSaveRsl = async () => {
    if (!generatedXml) {
      toast.error("No RSL document to save", {
        description: "Please generate an RSL document first by clicking 'Update RSL'.",
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
      const response = await fetch('/api/rsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: `${protocol}://${url}`,
          xmlContent: generatedXml,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("RSL updated successfully!", {
            description: `Your RSL document for ${protocol}://${url} has been updated.`,
          });
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
      console.error('Error saving RSL:', error);
      toast.error("Network error", {
        description: "Unable to connect to the server. Please check your connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLinks = crawledLinks.filter(link =>
    link.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <DashboardHeader
          heading="Edit RSL"
          text="Loading RSL document..."
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

        <div className="max-w-6xl">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Icons.spinner className="size-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Error state (RSL not found)
  if (!rsl) {
    return (
      <>
        <DashboardHeader
          heading="RSL Not Found"
          text="The requested RSL document could not be found."
        >
          <div className="flex gap-2">
            <Link href="/dashboard/rsl">
              <Button variant="outline">
                <Icons.arrowLeft className="mr-2 size-4" />
                Back to RSL List
              </Button>
            </Link>
          </div>
        </DashboardHeader>
      </>
    );
  }

  // XML Preview view (same as create page preview)
  if (showXmlView) {
    return (
      <>
        <DashboardHeader
          heading="RSL Document Preview"
          text="Generated RSL XML document based on your configuration"
        >
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowXmlView(false)}
            >
              <Icons.arrowLeft className="mr-2 size-4" />
              Back to Form
            </Button>
            <Button>
              <Icons.help className="mr-2 size-4" />
              Learn more
            </Button>
          </div>
        </DashboardHeader>

        <div className="flex">
          <div className="w-3/5 min-w-0 flex-1 pr-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">RSL Document</CardTitle>
                  <CardDescription>
                    Review your generated RSL XML document. You can copy, save, or download it from the actions panel.
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
                    <div className="p-4 pr-16">
                      <HighlightedXml 
                        code={generatedXml} 
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Actions */}
          <div className="sticky top-0 h-screen w-2/5 overflow-y-auto p-6" style={{backgroundColor: 'rgb(244, 244, 245)'}}>
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
                    <span className="ml-2 truncate font-medium" title={`${protocol}://${url}`}>
                      {`${protocol}://${url}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Document size:</span>
                    <span className="font-medium">
                      {(new Blob([generatedXml]).size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Content URLs:</span>
                    <span className="font-medium">
                      {crawledLinks.filter(link => link.selected).length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total licenses:</span>
                    <span className="font-medium">
                      {crawledLinks
                        .filter(link => link.selected && link.formData?.rsl)
                        .reduce((total, link) => 
                          total + (link.formData?.rsl?.licenses?.length || 0), 0
                        )}
                    </span>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Primary Actions</h4>
                  
                  <Button
                    onClick={handleSaveRsl}
                    disabled={isSaving || !generatedXml || !url}
                    className="w-full bg-black text-white hover:bg-black/90"
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
                      const blob = new Blob([generatedXml], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'rsl-document.xml';
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
                  <h4 className="text-sm font-medium text-muted-foreground">Additional Options</h4>
                  
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
                      const blob = new Blob([generatedXml], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
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
                    <span className="text-muted-foreground">Document ready</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your RSL document has been generated successfully and is ready to save or download.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Main form state (same as create page with pre-populated data)
  return (
    <>
      <DashboardHeader
        heading="Edit RSL"
        text="Review and modify your RSL configuration, then regenerate the document."
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
        <div className="w-3/5 min-w-0 flex-1 pr-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Website details
                  <Icons.chevronUp className="size-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="edit">Edit existing</TabsTrigger>
                    <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
                    <TabsTrigger value="individual">Individual link</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="edit" className="space-y-4">
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
                        <Icons.info className="mt-0.5 size-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Editing existing RSL configuration. Modify the settings below and click &ldquo;Update RSL&rdquo; to regenerate the document.
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
              </CardContent>
            </Card>

            {/* Link Sources Section */}
            {crawledLinks.length > 0 && (
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
                    {filteredLinks.map((link) => (
                      <div key={link.id} className="rounded-lg border">
                        {/* URL Header */}
                        <div 
                          className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-muted/50"
                          onClick={() => toggleUrlExpanded(link.url)}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Checkbox 
                              checked={link.selected}
                              onCheckedChange={() => toggleLinkSelection(link.url)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <span className="max-w-full truncate text-sm">{link.url}</span>
                              <Badge variant="secondary" className="shrink-0 border-blue-200 bg-blue-500/10 text-xs text-blue-700">
                                Existing
                              </Badge>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Icons.chevronDown className={cn(
                              "size-4 text-muted-foreground transition-transform", 
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
                                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    RSL Configuration
                                  </h4>
                                </div>

                                <div className="space-y-6">
                                  {/* Content Settings Card */}
                                  <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="flex items-center gap-2 text-sm">
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
                                        <CardTitle className="flex items-center gap-2 text-sm">
                                          License Management
                                        </CardTitle>
                                        {getCurrentLicenses(link.url).length > 0 && (
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
                                    </CardHeader>
                                    <CardContent>
                                      {(() => {
                                        const licenses = getCurrentLicenses(link.url);
                                        
                                        if (licenses.length === 0) {
                                          return (
                                            <div className="px-4 py-8 text-center">
                                              <h3 className="mb-2 text-sm font-medium text-muted-foreground">No licenses configured</h3>
                                              <p className="mb-4 text-xs text-muted-foreground">Create your first license to define usage rights for this content.</p>
                                              <Button onClick={() => addLicense(link.url)} size="sm">
                                                <Icons.add className="mr-1 size-4" />
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
                                              <div className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-2">
                                                {licenses.map((license) => (
                                                  <div key={license.id} className="flex items-center">
                                                    <Button
                                                      variant={activeLicenseTab[link.url] === license.id ? "default" : "ghost"}
                                                      size="sm"
                                                      onClick={() => setActiveLicenseTab(prev => ({ ...prev, [link.url]: license.id }))}
                                                      className="h-8 rounded-r-none"
                                                    >
                                                      {license.name || `License ${licenses.indexOf(license) + 1}`}
                                                    </Button>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={() => removeLicense(link.url, license.id)}
                                                      className="h-8 rounded-l-none border-l px-2 hover:bg-destructive hover:text-destructive-foreground"
                                                      disabled={licenses.length === 1}
                                                    >
                                                      <Icons.trash className="size-3" />
                                                    </Button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* License Form */}
                                            <div className="space-y-6 rounded-lg border bg-background p-4">
                                              {/* Basic License Info */}
                                              <div className="space-y-4">
                                                <div className="flex items-center gap-2 border-b pb-2">
                                                  <Icons.edit className="size-4" />
                                                  <h4 className="text-sm font-medium">Basic Information</h4>
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
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="purchase">Purchase</SelectItem>
                                                        <SelectItem value="subscription">Subscription</SelectItem>
                                                        <SelectItem value="training">Training</SelectItem>
                                                        <SelectItem value="crawl">Crawl</SelectItem>
                                                        <SelectItem value="inference">Inference</SelectItem>
                                                        <SelectItem value="attribution">Attribution</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Usage Permissions */}
                                              <div className="space-y-4">
                                                <div className="flex items-center gap-2 border-b pb-2">
                                                  <Icons.check className="size-4 text-green-600" />
                                                  <h4 className="text-sm font-medium">Permitted Usage</h4>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                  {[
                                                    { id: "all", label: "All Usage" },
                                                    { id: "train-ai", label: "Train AI" },
                                                    { id: "train-genai", label: "Train GenAI" },
                                                    { id: "ai-use", label: "AI Use" },
                                                    { id: "ai-summarize", label: "AI Summarize" },
                                                    { id: "search", label: "Search" }
                                                  ].map((usage) => (
                                                    <div key={usage.id} className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
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
                                                      <Label htmlFor={`permit-${usage.id}-${link.id}-${currentLicense.id}`} className="cursor-pointer text-sm font-medium">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Sidebar - Sources */}
        <div className="sticky top-0 h-screen w-2/5 overflow-y-auto p-6" style={{backgroundColor: 'rgb(244, 244, 245)'}}>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Document Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{crawledLinks.length} URLs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Loaded</span>
                  <Icons.check className="size-3 text-green-600" />
                </div>
              </div>
              
              {/* RSL Configuration Summary */}
              {crawledLinks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
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
              
              <Button 
                className="w-full bg-black text-white hover:bg-black/90" 
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
