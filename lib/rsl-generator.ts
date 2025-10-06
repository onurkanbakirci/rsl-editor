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
  copyrightHolder?: string;
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
    copyrightHolder: string;
    copyrightType: "person" | "organization";
    contactEmail: string;
    contactUrl: string;
    termsUrl: string;
  };
}

// Factory Pattern Implementation for License Creation

/**
 * Abstract base class for license factories
 */
abstract class LicenseFactory {
  protected generateId(): string {
    return `license-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected createBaseLicense(name: string): RslLicense {
    return {
      id: this.generateId(),
      name,
      permits: { usage: [], user: [], geo: [] },
      prohibits: { usage: [], user: [], geo: [] },
      payment: {
        type: "free" as const,
        standardUrls: [],
        customUrl: "",
        amount: "",
        currency: "USD"
      },
      legal: [],
    };
  }

  abstract createLicense(options?: any): RslLicense;
}

/**
 * Factory for creating free licenses
 */
class FreeLicenseFactory extends LicenseFactory {
  createLicense(options: { name?: string; permits?: string[] } = {}): RslLicense {
    const license = this.createBaseLicense(options.name || "Free License");

    if (options.permits?.length) {
      license.permits!.usage = options.permits;
    }

    return license;
  }
}

/**
 * Factory for creating commercial licenses
 */
class CommercialLicenseFactory extends LicenseFactory {
  createLicense(options: {
    name?: string;
    amount?: string;
    currency?: string;
    paymentType?: "purchase" | "subscription";
  } = {}): RslLicense {
    const license = this.createBaseLicense(options.name || "Commercial License");

    license.payment = {
      type: options.paymentType || "purchase",
      standardUrls: [],
      customUrl: "",
      amount: options.amount || "",
      currency: options.currency || "USD"
    };

    // Add common commercial permits
    license.permits!.usage = ["all"];
    license.permits!.user = ["commercial"];

    return license;
  }
}

/**
 * Factory for creating educational licenses
 */
class EducationalLicenseFactory extends LicenseFactory {
  createLicense(options: { name?: string } = {}): RslLicense {
    const license = this.createBaseLicense(options.name || "Educational License");

    license.permits!.usage = ["ai-train", "search"];
    license.permits!.user = ["education"];

    // Add educational disclaimers
    license.legal = [
      { type: "disclaimer", terms: ["as-is", "no-warranty"] }
    ];

    return license;
  }
}

/**
 * Factory for creating research licenses
 */
class ResearchLicenseFactory extends LicenseFactory {
  createLicense(options: { name?: string; nonCommercialOnly?: boolean } = {}): RslLicense {
    const license = this.createBaseLicense(options.name || "Research License");

    license.permits!.usage = ["ai-train", "ai-input"];
    license.permits!.user = options.nonCommercialOnly ? ["non-commercial"] : ["education", "non-commercial"];

    return license;
  }
}

/**
 * Main factory class that creates appropriate license factories
 */
export class LicenseFactoryManager {
  private static factories = new Map<string, LicenseFactory>([
    ['free', new FreeLicenseFactory()],
    ['commercial', new CommercialLicenseFactory()],
    ['educational', new EducationalLicenseFactory()],
    ['research', new ResearchLicenseFactory()],
  ]);

  static createLicense(type: string, options?: any): RslLicense {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown license type: ${type}`);
    }
    return factory.createLicense(options);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

/**
 * Creates a new license with default values (backward compatibility)
 */
export function createNewLicense(existingLicensesCount: number = 0): RslLicense {
  return LicenseFactoryManager.createLicense('free', {
    name: `License Option ${existingLicensesCount + 1}`
  });
}

/**
 * Creates a license of specific type with options
 */
export function createLicenseOfType(
  type: 'free' | 'commercial' | 'educational' | 'research',
  options?: any
): RslLicense {
  return LicenseFactoryManager.createLicense(type, options);
}

// Builder Pattern Implementation for RSL XML Generation

/**
 * Builder class for constructing RSL XML elements
 */
class RslXmlBuilder {
  private xmlParts: string[] = [];
  private indentLevel: number = 0;

  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }

  private addLine(content: string): this {
    this.xmlParts.push(this.indent() + content);
    return this;
  }

  private addElement(tagName: string, content?: string, attributes?: Record<string, string>): this {
    const attrs = attributes ?
      Object.entries(attributes)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('') : '';

    if (content) {
      this.addLine(`<${tagName}${attrs}>${content}</${tagName}>`);
    } else {
      this.addLine(`<${tagName}${attrs}/>`);
    }
    return this;
  }

  private openElement(tagName: string, attributes?: Record<string, string>): this {
    const attrs = attributes ?
      Object.entries(attributes)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('') : '';

    this.addLine(`<${tagName}${attrs}>`);
    this.indentLevel++;
    return this;
  }

  private closeElement(tagName: string): this {
    this.indentLevel--;
    this.addLine(`</${tagName}>`);
    return this;
  }

  startDocument(): this {
    this.xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    return this.openElement('rsl', { xmlns: 'https://rslstandard.org/rsl' });
  }

  addEmptyDocument(): this {
    this.addLine('<!-- No content selected for licensing -->');
    return this;
  }

  addContent(content: RslContent): this {
    const rslData = content.rsl;
    const attributes: Record<string, string> = { url: content.url };

    if (rslData.licenseServer) attributes.server = rslData.licenseServer;
    if (rslData.encrypted) attributes.encrypted = 'true';
    if (rslData.lastModified) attributes.lastmod = rslData.lastModified;

    this.openElement('content', attributes);

    // Add licenses
    if (rslData.licenses) {
      rslData.licenses.forEach(license => this.addLicense(license));
    }

    // Add metadata
    if (rslData.metadata) {
      this.addMetadata(rslData.metadata);
    }

    return this.closeElement('content');
  }

  private addLicense(license: RslLicense): this {
    this.openElement('license');

    // Add permits
    this.addPermissions('permits', license.permits);

    // Add prohibits
    this.addPermissions('prohibits', license.prohibits);

    // Add payment
    if (license.payment?.type) {
      this.addPayment(license.payment);
    }

    // Add legal
    if (license.legal?.length) {
      license.legal.forEach(legal => this.addLegal(legal));
    }

    return this.closeElement('license');
  }

  private addPermissions(elementName: string, permissions?: { usage?: string[]; user?: string[]; geo?: string[] }): this {
    if (!permissions) return this;

    if (permissions.usage?.length) {
      this.addElement(elementName, permissions.usage.join(','), { type: 'usage' });
    }
    if (permissions.user?.length) {
      this.addElement(elementName, permissions.user.join(','), { type: 'user' });
    }
    if (permissions.geo?.length) {
      this.addElement(elementName, permissions.geo.join(','), { type: 'geo' });
    }

    return this;
  }

  private addPayment(payment: NonNullable<RslLicense['payment']>): this {
    const hasContent = payment.standardUrls?.length || payment.customUrl ||
      (payment.amount && payment.currency);

    const paymentType = payment.type || 'free';

    if (hasContent) {
      this.openElement('payment', { type: paymentType });

      if (payment.standardUrls?.length) {
        payment.standardUrls.forEach(url =>
          this.addElement('standard', url)
        );
      }

      if (payment.customUrl) {
        this.addElement('custom', payment.customUrl);
      }

      if (payment.amount && payment.currency) {
        this.addElement('amount', payment.amount, { currency: payment.currency });
      }

      this.closeElement('payment');
    } else {
      this.addElement('payment', undefined, { type: paymentType });
    }

    return this;
  }

  private addLegal(legal: { type: 'warranty' | 'disclaimer'; terms: string[] }): this {
    if (legal.terms.length) {
      this.addElement('legal', legal.terms.join(','), { type: legal.type });
    } else {
      this.addElement('legal', undefined, { type: legal.type });
    }
    return this;
  }

  private addMetadata(metadata: RslMetadata): this {
    if (metadata.schemaUrl) {
      this.addElement('schema', metadata.schemaUrl);
    }

    if (metadata.copyrightHolder || metadata.copyrightType ||
      metadata.contactEmail || metadata.contactUrl) {
      const attributes: Record<string, string> = {};

      if (metadata.copyrightType) attributes.type = metadata.copyrightType;
      if (metadata.contactEmail) attributes.contactEmail = metadata.contactEmail;
      if (metadata.contactUrl) attributes.contactUrl = metadata.contactUrl;

      this.addElement('copyright', metadata.copyrightHolder || undefined, attributes);
    }

    if (metadata.termsUrl) {
      this.addElement('terms', metadata.termsUrl);
    }

    return this;
  }

  build(): string {
    this.closeElement('rsl');
    return this.xmlParts.join('\n');
  }
}

/**
 * Generates RSL XML document from content data using Builder pattern
 */
export function generateRslXml(contents: RslContent[]): string {
  const builder = new RslXmlBuilder();

  builder.startDocument();

  if (contents.length === 0) {
    builder.addEmptyDocument();
  } else {
    contents.forEach(content => builder.addContent(content));
  }

  return builder.build();
}


/**
 * Helper function to get permitted usage types (according to RSL spec)
 */
export function getAvailableUsageTypes(): Array<{ id: string; label: string; description: string }> {
  return [
    { id: "all", label: "All Usage", description: "Any automated processing, including AI training and search" },
    { id: "ai-train", label: "AI Training", description: "Training or fine-tuning AI models" },
    { id: "ai-input", label: "AI Input", description: "Inputting content into AI models (RAG, grounding, etc.)" },
    { id: "search", label: "Search Indexing", description: "Building search index and providing search results" },
  ];
}

/**
 * Helper function to get available user types
 */
export function getAvailableUserTypes(): Array<{ id: string; label: string; description: string }> {
  return [
    { id: "commercial", label: "Commercial", description: "General commercial use" },
    { id: "non-commercial", label: "Non-Commercial", description: "Non-commercial purposes" },
    { id: "education", label: "Educational", description: "Educational use in schools or universities" },
    { id: "government", label: "Government", description: "Government or public sector purposes" },
    { id: "personal", label: "Personal", description: "Individual or personal use only" },
  ];
}

/**
 * Helper function to get common country codes for geo restrictions
 */
export function getAvailableGeoCodes(): Array<{ id: string; label: string }> {
  return [
    { id: "US", label: "United States" },
    { id: "EU", label: "European Union" },
    { id: "GB", label: "United Kingdom" },
    { id: "CA", label: "Canada" },
    { id: "AU", label: "Australia" },
    { id: "JP", label: "Japan" },
    { id: "CN", label: "China" },
    { id: "IN", label: "India" },
    { id: "BR", label: "Brazil" },
    { id: "DE", label: "Germany" },
    { id: "FR", label: "France" },
    { id: "IT", label: "Italy" },
    { id: "ES", label: "Spain" },
    { id: "NL", label: "Netherlands" },
    { id: "SE", label: "Sweden" },
    { id: "NO", label: "Norway" },
    { id: "DK", label: "Denmark" },
    { id: "FI", label: "Finland" },
  ];
}

/**
 * Helper function to get available legal warranty types
 */
export function getAvailableWarrantyTypes(): Array<{ id: string; label: string; description: string }> {
  return [
    { id: "ownership", label: "Ownership", description: "Licensor owns/controls copyright or exclusive licensing rights" },
    { id: "authority", label: "Authority", description: "Licensor is authorized to grant the rights described" },
    { id: "no-infringement", label: "No Infringement", description: "Asset does not infringe third-party IP" },
    { id: "privacy-consent", label: "Privacy Consent", description: "Required consents for personal data have been obtained" },
    { id: "no-malware", label: "No Malware", description: "Asset is free from malicious code" },
  ];
}

/**
 * Helper function to get available legal disclaimer types
 */
export function getAvailableDisclaimerTypes(): Array<{ id: string; label: string; description: string }> {
  return [
    { id: "as-is", label: "As Is", description: "Asset provided 'as is'" },
    { id: "no-warranty", label: "No Warranty", description: "No express or implied warranties" },
    { id: "no-liability", label: "No Liability", description: "Licensor disclaims liability for damages" },
    { id: "no-indemnity", label: "No Indemnity", description: "Licensor does not provide indemnification" },
  ];
}

/**
 * Helper function to get available currency codes
 */
export function getAvailableCurrencies(): Array<{ id: string; label: string }> {
  return [
    { id: "USD", label: "US Dollar (USD)" },
    { id: "EUR", label: "Euro (EUR)" },
    { id: "GBP", label: "British Pound (GBP)" },
    { id: "JPY", label: "Japanese Yen (JPY)" },
    { id: "CAD", label: "Canadian Dollar (CAD)" },
    { id: "AUD", label: "Australian Dollar (AUD)" },
    { id: "CHF", label: "Swiss Franc (CHF)" },
    { id: "CNY", label: "Chinese Yuan (CNY)" },
    { id: "BTC", label: "Bitcoin (BTC)" },
    { id: "ETH", label: "Ethereum (ETH)" },
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
