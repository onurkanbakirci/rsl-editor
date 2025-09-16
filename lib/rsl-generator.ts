// Types for RSL data structure
export interface RslLicense {
  id: string;
  name?: string;
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
    standardUrls?: string[];
    customUrl?: string;
    amount?: string;
    currency?: string;
  };
  legal?: Array<{
    type: "warranty" | "disclaimer";
    terms: string[];
  }>;
}

export interface RslMetadata {
  schemaUrl?: string;
  copyrightType?: "person" | "organization";
  contactEmail?: string;
  contactUrl?: string;
  termsUrl?: string;
}

export interface RslData {
  licenseServer?: string;
  encrypted?: boolean;
  lastModified?: string;
  licenses?: RslLicense[];
  metadata?: RslMetadata;
}

export interface RslContent {
  url: string;
  rsl: RslData;
}

export interface EditableContent {
  url: string;
  licenseServer: string;
  encrypted: boolean;
  lastModified: string;
  licenses: RslLicense[];
  metadata: {
    schemaUrl: string;
    copyrightType: "person" | "organization";
    contactEmail: string;
    contactUrl: string;
    termsUrl: string;
  };
}

/**
 * Creates a new license with default values
 */
export function createNewLicense(existingLicensesCount: number = 0): RslLicense {
  return {
    id: `license-${Date.now()}`,
    name: `License Option ${existingLicensesCount + 1}`,
    permits: { usage: [], user: [], geo: [] },
    prohibits: { usage: [], user: [], geo: [] },
    payment: { type: "free" as const },
    legal: [],
  };
}

/**
 * Generates RSL XML document from content data
 */
export function generateRslXml(contents: RslContent[]): string {
  if (contents.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rsl xmlns="https://rslstandard.org/rsl">
  <!-- No content selected for licensing -->
</rsl>`;
  }

  const contentElements = contents
    .map((content) => {
      const rslData = content.rsl;
      const licenses = rslData.licenses || [];

      // Build content attributes
      let contentAttrs = `url="${content.url}"`;
      if (rslData.licenseServer)
        contentAttrs += ` server="${rslData.licenseServer}"`;
      if (rslData.encrypted) contentAttrs += ` encrypted="true"`;
      if (rslData.lastModified)
        contentAttrs += ` lastmod="${rslData.lastModified}"`;

      // Build license elements
      const licenseElements = licenses
        .map((license) => {
          let licenseContent = "";

          // Permits
          if (license.permits?.usage?.length) {
            licenseContent += `    <permits type="usage">${license.permits.usage.join(",")}</permits>\n`;
          }
          if (license.permits?.user?.length) {
            licenseContent += `    <permits type="user">${license.permits.user.join(",")}</permits>\n`;
          }
          if (license.permits?.geo?.length) {
            licenseContent += `    <permits type="geo">${license.permits.geo.join(",")}</permits>\n`;
          }

          // Prohibits
          if (license.prohibits?.usage?.length) {
            licenseContent += `    <prohibits type="usage">${license.prohibits.usage.join(",")}</prohibits>\n`;
          }
          if (license.prohibits?.user?.length) {
            licenseContent += `    <prohibits type="user">${license.prohibits.user.join(",")}</prohibits>\n`;
          }
          if (license.prohibits?.geo?.length) {
            licenseContent += `    <prohibits type="geo">${license.prohibits.geo.join(",")}</prohibits>\n`;
          }

          // Payment
          if (license.payment?.type) {
            let paymentContent = "";
            if (license.payment.standardUrls?.length) {
              paymentContent +=
                license.payment.standardUrls
                  .map((url) => `      <standard>${url}</standard>`)
                  .join("\n") + "\n";
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
            license.legal.forEach((legal) => {
              if (legal.terms.length) {
                licenseContent += `    <legal type="${legal.type}">${legal.terms.join(",")}</legal>\n`;
              }
            });
          }

          return `  <license>\n${licenseContent}  </license>`;
        })
        .join("\n");

      // Build metadata elements
      let metadataElements = "";
      if (rslData.metadata?.schemaUrl) {
        metadataElements += `  <schema>${rslData.metadata.schemaUrl}</schema>\n`;
      }
      if (
        rslData.metadata?.copyrightType ||
        rslData.metadata?.contactEmail ||
        rslData.metadata?.contactUrl
      ) {
        let copyrightAttrs = "";
        if (rslData.metadata.copyrightType)
          copyrightAttrs += ` type="${rslData.metadata.copyrightType}"`;
        if (rslData.metadata.contactEmail)
          copyrightAttrs += ` contactEmail="${rslData.metadata.contactEmail}"`;
        if (rslData.metadata.contactUrl)
          copyrightAttrs += ` contactUrl="${rslData.metadata.contactUrl}"`;
        metadataElements += `  <copyright${copyrightAttrs}/>\n`;
      }
      if (rslData.metadata?.termsUrl) {
        metadataElements += `  <terms>${rslData.metadata.termsUrl}</terms>\n`;
      }

      return `  <content ${contentAttrs}>
${licenseElements}
${metadataElements}  </content>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsl xmlns="https://rslstandard.org/rsl">
${contentElements}
</rsl>`;
}

/**
 * Validates RSL data before generation
 */
export function validateRslData(contents: RslContent[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (contents.length === 0) {
    errors.push("No content provided for RSL generation");
  }

  contents.forEach((content, index) => {
    if (!content.url) {
      errors.push(`Content at index ${index} is missing URL`);
    }

    if (!content.rsl.licenses || content.rsl.licenses.length === 0) {
      errors.push(`Content "${content.url}" has no licenses configured`);
    }

    content.rsl.licenses?.forEach((license, licenseIndex) => {
      if (!license.id) {
        errors.push(`License at index ${licenseIndex} for "${content.url}" is missing ID`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to get permitted usage types
 */
export function getAvailableUsageTypes(): Array<{ id: string; label: string }> {
  return [
    { id: "all", label: "All Usage" },
    { id: "train-ai", label: "Train AI" },
    { id: "train-genai", label: "Train GenAI" },
    { id: "ai-use", label: "AI Use" },
    { id: "ai-summarize", label: "AI Summarize" },
    { id: "search", label: "Search" },
  ];
}

/**
 * Helper function to get available payment types
 */
export function getAvailablePaymentTypes(): Array<{ value: string; label: string }> {
  return [
    { value: "free", label: "Free" },
    { value: "purchase", label: "Purchase" },
    { value: "subscription", label: "Subscription" },
    { value: "training", label: "Training" },
    { value: "crawl", label: "Crawl" },
    { value: "inference", label: "Inference" },
    { value: "attribution", label: "Attribution" },
  ];
}

/**
 * Parses RSL XML content to extract editable configuration data for editing
 */
export function parseRslXmlToEditableContent(xmlContent: string, websiteUrl: string): EditableContent[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const contentElements = xmlDoc.getElementsByTagName('content');
    const contents: EditableContent[] = [];
    
    Array.from(contentElements).forEach((contentEl) => {
      const contentUrl = contentEl.getAttribute('url') || websiteUrl;
      const licenseServer = contentEl.getAttribute('server') || '';
      const encrypted = contentEl.getAttribute('encrypted') === 'true';
      const lastModified = contentEl.getAttribute('lastmod') || '';
      
      // Parse licenses
      const licenseElements = contentEl.getElementsByTagName('license');
      const licenses: RslLicense[] = [];
      
      Array.from(licenseElements).forEach((licenseEl, licenseIndex) => {
        const license: RslLicense = {
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
          if (type && license.permits && type in license.permits) {
            (license.permits as any)[type] = values;
          }
        });
        
        // Parse prohibits
        const prohibitElements = licenseEl.getElementsByTagName('prohibits');
        Array.from(prohibitElements).forEach(prohibitEl => {
          const type = prohibitEl.getAttribute('type');
          const values = prohibitEl.textContent?.split(',').map(v => v.trim()).filter(v => v) || [];
          if (type && license.prohibits && type in license.prohibits) {
            (license.prohibits as any)[type] = values;
          }
        });
        
        // Parse payment
        const paymentElements = licenseEl.getElementsByTagName('payment');
        if (paymentElements.length > 0) {
          const paymentEl = paymentElements[0];
          const paymentType = paymentEl.getAttribute('type');
          if (license.payment) {
            (license.payment as any).type = paymentType || 'free';
          
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
        }
        
        // Parse legal
        const legalElements = licenseEl.getElementsByTagName('legal');
        Array.from(legalElements).forEach(legalEl => {
          const type = legalEl.getAttribute('type') as 'warranty' | 'disclaimer';
          const terms = legalEl.textContent?.split(',').map(t => t.trim()).filter(t => t) || [];
          if (type && terms.length > 0 && license.legal) {
            license.legal.push({ type, terms });
          }
        });
        
        licenses.push(license);
      });
      
      // Parse metadata
      const metadata: {
        schemaUrl: string;
        copyrightType: "person" | "organization";
        contactEmail: string;
        contactUrl: string;
        termsUrl: string;
      } = {
        schemaUrl: '',
        copyrightType: 'person',
        contactEmail: '',
        contactUrl: '',
        termsUrl: ''
      };
      
      const schemaElements = contentEl.getElementsByTagName('schema');
      if (schemaElements.length > 0) {
        metadata.schemaUrl = schemaElements[0].textContent || '';
      }
      
      const copyrightElements = contentEl.getElementsByTagName('copyright');
      if (copyrightElements.length > 0) {
        const copyrightEl = copyrightElements[0];
        const copyrightType = copyrightEl.getAttribute('type');
        metadata.copyrightType = (copyrightType === 'organization') ? 'organization' : 'person';
        metadata.contactEmail = copyrightEl.getAttribute('contactEmail') || '';
        metadata.contactUrl = copyrightEl.getAttribute('contactUrl') || '';
      }
      
      const termsElements = contentEl.getElementsByTagName('terms');
      if (termsElements.length > 0) {
        metadata.termsUrl = termsElements[0].textContent || '';
      }
      
      // Create editable content object
      const content: EditableContent = {
        url: contentUrl,
        licenseServer,
        encrypted,
        lastModified,
        licenses: licenses.length > 0 ? licenses : [createNewLicense()],
        metadata
      };
      
      contents.push(content);
    });
    
    return contents.length > 0 ? contents : [{
      url: websiteUrl,
      licenseServer: '',
      encrypted: false,
      lastModified: '',
      licenses: [createNewLicense()],
      metadata: {
        schemaUrl: '',
        copyrightType: 'person',
        contactEmail: '',
        contactUrl: '',
        termsUrl: ''
      }
    }];
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [{
      url: websiteUrl,
      licenseServer: '',
      encrypted: false,
      lastModified: '',
      licenses: [createNewLicense()],
      metadata: {
        schemaUrl: '',
        copyrightType: 'person',
        contactEmail: '',
        contactUrl: '',
        termsUrl: ''
      }
    }];
  }
}
