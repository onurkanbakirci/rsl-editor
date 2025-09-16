"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/shared/icons";
import CreateRSLPage from "../../create/page";

interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent: string;
  createdAt: string;
  updatedAt: string;
}

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
        copyrightType?: "person" | "organization";
        contactEmail?: string;
        contactUrl?: string;
        termsUrl?: string;
      };
    };
  };
}

export default function EditRSLPage() {
  const params = useParams();
  const router = useRouter();
  const [rsl, setRsl] = useState<RSL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rslId = params.id as string;

  // Parse XML content to extract configuration data (same as in [id]/page.tsx)
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
          isNew: false, // Existing links from XML are not new
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

  // Fetch RSL data
  useEffect(() => {
    const fetchRslData = async () => {
      if (!rslId) return;
      
      try {
        const response = await fetch(`/api/rsl/${rslId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setRsl(result.data);
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

  // Extract initial data from the RSL
  const initialData = {
    websiteUrl: rsl.websiteUrl,
    xmlContent: rsl.xmlContent,
    crawledLinks: rsl.xmlContent ? parseXmlToConfig(rsl.xmlContent, rsl.websiteUrl) : [],
    rslId: rsl.id
  };

  // Render the CreateRSLPage component with initial data for editing
  return <CreateRSLPage initialData={initialData} />;
}
