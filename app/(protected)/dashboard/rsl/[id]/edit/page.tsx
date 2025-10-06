import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getRSLById } from "@/lib/rsl";
import { parseRslXmlToEditableContent } from "@/lib/rsl-parser-server";
import { generateRslXml, createNewLicense, type RslLicense } from "@/lib/rsl-generator";
import { EditRslForm } from "@/components/forms/edit-rsl-form";

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

export default async function EditRslPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    redirect("/login");
  }

  // Get RSL data directly from database
  const rslData = await getRSLById(params.id, user.id);
  
  if (!rslData) {
    redirect("/dashboard");
  }

  // Parse existing RSL data into crawled links format
  let initialLinks: CrawledLink[] = [];
  let initialUrl = '';
  let initialProtocol = 'https';

  try {
    const editableContent = parseRslXmlToEditableContent(rslData.xmlContent, rslData.websiteUrl);
    
    // Extract URL and protocol
    const websiteUrl = rslData.websiteUrl;
    try {
      const urlObj = new URL(websiteUrl);
      initialProtocol = urlObj.protocol.replace(':', '');
      initialUrl = urlObj.hostname + urlObj.pathname + urlObj.search;
    } catch {
      initialUrl = websiteUrl;
    }

    initialLinks = editableContent.map((content, index) => ({
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
  } catch (error) {
    console.error('Error parsing RSL data:', error);
    // Create a default link if parsing fails
    initialLinks = [{
      id: 'default-1',
      url: rslData.websiteUrl,
      status: "completed",
      selected: true,
      formData: {
        rsl: {
          licenseServer: '',
          encrypted: false,
          lastModified: '',
          licenses: [createNewLicense()],
          metadata: {
            schemaUrl: '',
            copyrightHolder: '',
            copyrightType: 'person',
            contactEmail: '',
            contactUrl: '',
            termsUrl: ''
          },
        },
      },
    }];
  }

  return (
    <EditRslForm 
      rslId={params.id}
      initialUrl={initialUrl}
      initialProtocol={initialProtocol}
      initialLinks={initialLinks}
    />
  );
}