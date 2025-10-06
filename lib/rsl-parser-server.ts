import { RslLicense, EditableContent, createNewLicense } from './rsl-generator';

/**
 * Fallback regex-based XML parser for server environments when JSDOM is not available
 */
function parseRslXmlWithRegex(xmlContent: string, websiteUrl: string): EditableContent[] {
  const contents: EditableContent[] = [];
  
  // Extract content elements using regex
  const contentRegex = /<content[^>]*>/g;
  const contentMatches = xmlContent.match(contentRegex);
  
  if (!contentMatches) {
    return [{
      url: websiteUrl,
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
      }
    }];
  }
  
  contentMatches.forEach((contentMatch) => {
    // Extract attributes using regex
    const urlMatch = contentMatch.match(/url=["']([^"']*)["']/);
    const serverMatch = contentMatch.match(/server=["']([^"']*)["']/);
    const encryptedMatch = contentMatch.match(/encrypted=["']([^"']*)["']/);
    const lastmodMatch = contentMatch.match(/lastmod=["']([^"']*)["']/);
    
    const contentUrl = urlMatch ? urlMatch[1] : websiteUrl;
    const licenseServer = serverMatch ? serverMatch[1] : '';
    const encrypted = encryptedMatch ? encryptedMatch[1] === 'true' : false;
    const lastModified = lastmodMatch ? lastmodMatch[1] : '';
    
    // For the regex fallback, we'll create a default license since parsing nested elements is complex
    const content: EditableContent = {
      url: contentUrl,
      licenseServer,
      encrypted,
      lastModified,
      licenses: [createNewLicense()],
      metadata: {
        schemaUrl: '',
        copyrightHolder: '',
        copyrightType: 'person',
        contactEmail: '',
        contactUrl: '',
        termsUrl: ''
      }
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
      copyrightHolder: '',
      copyrightType: 'person',
      contactEmail: '',
      contactUrl: '',
      termsUrl: ''
    }
  }];
}

/**
 * Parses RSL XML content to extract editable configuration data for editing
 * Server-only function that uses JSDOM for XML parsing
 */
export function parseRslXmlToEditableContent(xmlContent: string, websiteUrl: string): EditableContent[] {
  try {
    // Use a server-side XML parser that works in both browser and Node.js environments
    let xmlDoc: Document;
    
    if (typeof window !== 'undefined' && window.DOMParser) {
      // Browser environment
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    } else {
      // Server environment - use the JSDOM from crawlee dependencies
      try {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
        xmlDoc = dom.window.document;
      } catch (jsdomError) {
        // Fallback to a simple regex-based parser for server environment
        return parseRslXmlWithRegex(xmlContent, websiteUrl);
      }
    }

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
          payment: {
            type: 'free',
            standardUrls: [],
            customUrl: "",
            amount: "",
            currency: "USD"
          },
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
        copyrightHolder: string;
        copyrightType: "person" | "organization";
        contactEmail: string;
        contactUrl: string;
        termsUrl: string;
      } = {
        schemaUrl: '',
        copyrightHolder: '',
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
        metadata.copyrightHolder = copyrightEl.textContent || '';
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
        copyrightHolder: '',
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
        copyrightHolder: '',
        copyrightType: 'person',
        contactEmail: '',
        contactUrl: '',
        termsUrl: ''
      }
    }];
  }
}
