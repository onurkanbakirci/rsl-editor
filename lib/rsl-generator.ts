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
