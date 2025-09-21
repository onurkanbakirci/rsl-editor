// Types for RSS integration
export interface RssIntegrationOptions {
  title?: string;
  link?: string;
  description?: string;
  maxItems?: number;
  includeMetadata?: boolean;
}

// Types for robots.txt integration
export interface RobotsIntegrationOptions {
  websiteUrl?: string;
  licenseUrl?: string;
  includeUserAgents?: boolean;
  customDirectives?: string[];
}

// Types for web pages integration
export interface WebPagesIntegrationOptions {
  websiteUrl?: string;
  licenseServer?: string;
  integrationType?: 'embedded' | 'linked';
  includeTemplate?: boolean;
}

// Types for media files integration
export interface MediaFilesIntegrationOptions {
  websiteUrl?: string;
  licenseServer?: string;
  fileType?: 'image' | 'epub' | 'generic';
  canonicalUrl?: string;
}

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  rslContent: string;
}

export interface RssDocument {
  channel: {
    title: string;
    link: string;
    description: string;
    items: RssItem[];
  };
  namespace: string;
}

// Re-export types from rsl-generator for convenience
export type { RslContent, RslLicense, RslData } from './rsl-generator';

// Strategy Pattern Implementation for RSS Generation

/**
 * Interface for RSS generation strategies
 */
interface RssGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions): string;
}

/**
 * Full RSS document strategy - generates complete RSS feed
 */
class FullRssDocumentStrategy implements RssGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions): string {
    const builder = new RssBuilder();
    
    return builder
      .startDocument(options)
      .addRslContents(rslContents, options.maxItems)
      .build();
  }
}

/**
 * Template RSS strategy - generates RSS with ellipsis for unknown sections
 */
class TemplateRssStrategy implements RssGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions): string {
    const builder = new RssBuilder();
    
    return builder
      .startTemplate(options)
      .addRslContentsAsTemplate(rslContents, options.maxItems)
      .buildTemplate();
  }
}

/**
 * RSL-only strategy - generates just the RSL content blocks
 */
class RslOnlyStrategy implements RssGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions): string {
    const builder = new RssBuilder();
    
    return builder
      .generateRslContentBlocks(rslContents, options.maxItems);
  }
}

// Builder Pattern Implementation for RSS XML Generation

/**
 * Builder class for constructing RSS XML with RSL integration
 */
class RssBuilder {
  private xmlParts: string[] = [];
  private indentLevel: number = 0;

  private indent(): string {
    return '  '.repeat(Math.max(0, this.indentLevel));
  }

  private addLine(content: string): this {
    this.xmlParts.push(this.indent() + content);
    return this;
  }

  private addComment(comment: string): this {
    return this.addLine(`<!-- ${comment} -->`);
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
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine(`</${tagName}>`);
    return this;
  }

  startDocument(options: RssIntegrationOptions = {}): this {
    this.addLine('<?xml version="1.0" encoding="UTF-8"?>');
    return this.openElement('rss', {
      'xmlns:rsl': 'https://rslstandard.org/rsl',
      version: '2.0'
    });
  }

  startTemplate(options: RssIntegrationOptions = {}): this {
    this.addLine('<?xml version="1.0" encoding="UTF-8"?>');
    return this.openElement('rss', {
      'xmlns:rsl': 'https://rslstandard.org/rsl',
      version: '2.0'
    });
  }

  addRslContents(rslContents: import('./rsl-generator').RslContent[], maxItems?: number): this {
    this.openElement('channel');
    
    // Add channel metadata
    this.addLine('<title>Your Website - Latest Articles</title>');
    this.addLine('<link>https://yourwebsite.com</link>');
    this.addLine('<description>Latest articles and content from your website</description>');
    
    // Add items with RSL content
    const itemsToProcess = maxItems ? rslContents.slice(0, maxItems) : rslContents;
    
    itemsToProcess.forEach((content, index) => {
      this.addRssItem(content, index + 1);
    });
    
    return this.closeElement('channel');
  }

  addRslContentsAsTemplate(rslContents: import('./rsl-generator').RslContent[], maxItems?: number): this {
    this.openElement('channel');
    
    // Add template channel metadata
    this.addComment('Your RSS channel metadata (title, link, description, etc.)');
    
    // If no RSL contents, show fallback template
    if (rslContents.length === 0) {
      this.openElement('item');
      this.addComment('Your RSS item metadata (title, link, description, pubDate, etc.)');
      this.openElement('rsl:content', { url: 'your-content-url' });
      this.openElement('rsl:license');
      this.addLine('<rsl:payment type="free"/>');
      this.openElement('rsl:permits');
      this.addLine('<rsl:usage>read</rsl:usage>');
      this.addLine('<rsl:user>individual</rsl:user>');
      this.closeElement('rsl:permits');
      this.closeElement('rsl:license');
      this.closeElement('rsl:content');
      this.closeElement('item');
      this.addComment('Additional RSS items...');
    } else {
      // Add template items with actual RSL content
      const itemsToProcess = maxItems ? rslContents.slice(0, maxItems) : rslContents;
      
      itemsToProcess.forEach((content, index) => {
        this.addTemplateRssItem(content, index + 1);
      });
      
      if (rslContents.length > 2) {
        this.addComment('Additional RSS items...');
      }
    }
    
    return this.closeElement('channel');
  }

  private addRssItem(content: import('./rsl-generator').RslContent, itemNumber: number): this {
    const urlPath = new URL(content.url).pathname;
    const title = `Article ${itemNumber}${urlPath !== '/' ? ` - ${urlPath.split('/').pop()}` : ''}`;
    
    this.openElement('item');
    this.addLine(`<title>${this.escapeXml(title)}</title>`);
    this.addLine(`<link>${this.escapeXml(content.url)}</link>`);
    this.addLine(`<description>Content with RSL licensing information</description>`);
    this.addLine(`<pubDate>${new Date().toUTCString()}</pubDate>`);
    
    // Add RSL content
    this.addRslContent(content);
    
    return this.closeElement('item');
  }

  private addTemplateRssItem(content: import('./rsl-generator').RslContent, itemNumber: number): this {
    this.openElement('item');
    this.addComment('Your RSS item metadata (title, link, description, pubDate, etc.)');
    
    // Add RSL content
    this.addRslContent(content);
    
    return this.closeElement('item');
  }

  private addRslContent(content: import('./rsl-generator').RslContent): this {
    const rslData = content.rsl;
    const attributes: Record<string, string> = { url: content.url };

    if (rslData.licenseServer) attributes.licenseServer = rslData.licenseServer;
    if (rslData.encrypted) attributes.encrypted = 'true';
    if (rslData.lastModified) attributes.lastModified = rslData.lastModified;

    this.openElement('rsl:content', attributes);

    // Add licenses
    if (rslData.licenses) {
      rslData.licenses.forEach(license => this.addRslLicense(license));
    }

    return this.closeElement('rsl:content');
  }

  private addRslLicense(license: import('./rsl-generator').RslLicense): this {
    const attributes: Record<string, string> = {};
    if (license.name) attributes.name = license.name;

    this.openElement('rsl:license', attributes);

    // Add payment
    if (license.payment?.type) {
      this.addRslPayment(license.payment);
    }

    // Add permits
    this.addRslPermissions('rsl:permits', license.permits);

    // Add legal
    if (license.legal?.length) {
      this.openElement('rsl:legal');
      license.legal.forEach(legal => {
        legal.terms?.forEach(term => {
          this.addLine(`<rsl:${legal.type} type="${term}"/>`);
        });
      });
      this.closeElement('rsl:legal');
    }

    return this.closeElement('rsl:license');
  }

  private addRslPayment(payment: NonNullable<import('./rsl-generator').RslLicense['payment']>): this {
    const attributes: Record<string, string> = { type: payment.type || 'free' };
    
    if (payment.amount) attributes.amount = payment.amount;
    if (payment.currency) attributes.currency = payment.currency;

    this.addLine(`<rsl:payment${Object.entries(attributes).map(([k, v]) => ` ${k}="${v}"`).join('')}/>`);
    
    return this;
  }

  private addRslPermissions(elementName: string, permissions?: { usage?: string[]; user?: string[]; geo?: string[] }): this {
    if (!permissions) return this;

    const hasPermissions = (permissions.usage?.length || 0) > 0 || 
                          (permissions.user?.length || 0) > 0 || 
                          (permissions.geo?.length || 0) > 0;

    if (hasPermissions) {
      this.openElement(elementName);
      
      permissions.usage?.forEach(usage => {
        this.addLine(`<rsl:usage>${this.escapeXml(usage)}</rsl:usage>`);
      });
      
      permissions.user?.forEach(user => {
        this.addLine(`<rsl:user>${this.escapeXml(user)}</rsl:user>`);
      });
      
      permissions.geo?.forEach(geo => {
        this.addLine(`<rsl:geo>${this.escapeXml(geo)}</rsl:geo>`);
      });
      
      this.closeElement(elementName);
    }

    return this;
  }

  generateRslContentBlocks(rslContents: import('./rsl-generator').RslContent[], maxItems?: number): string {
    const itemsToProcess = maxItems ? rslContents.slice(0, maxItems) : rslContents;
    
    const rslBlocks = itemsToProcess.map(content => {
      const tempBuilder = new RssBuilder();
      tempBuilder.addRslContent(content);
      return tempBuilder.xmlParts.join('\n');
    });

    return rslBlocks.join('\n\n');
  }

  build(): string {
    this.closeElement('rss');
    return this.xmlParts.join('\n');
  }

  buildTemplate(): string {
    this.closeElement('rss');
    return this.xmlParts.join('\n');
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Builder Pattern Implementation for robots.txt Integration

/**
 * Builder class for constructing robots.txt with RSL License directive
 */
class RobotsBuilder {
  private lines: string[] = [];

  addComment(comment: string): this {
    this.lines.push(`# ${comment}`);
    return this;
  }

  addLicenseDirective(licenseUrl: string): this {
    this.lines.push(`License: ${licenseUrl}`);
    return this;
  }

  addEmptyLine(): this {
    this.lines.push('');
    return this;
  }

  addUserAgent(userAgent: string = '*'): this {
    this.lines.push(`User-agent: ${userAgent}`);
    return this;
  }

  addDisallow(path: string): this {
    this.lines.push(`Disallow: ${path}`);
    return this;
  }

  addAllow(path: string): this {
    this.lines.push(`Allow: ${path}`);
    return this;
  }

  addCrawlDelay(seconds: number): this {
    this.lines.push(`Crawl-delay: ${seconds}`);
    return this;
  }

  addSitemap(sitemapUrl: string): this {
    this.lines.push(`Sitemap: ${sitemapUrl}`);
    return this;
  }

  addCustomDirective(directive: string): this {
    this.lines.push(directive);
    return this;
  }

  build(): string {
    return this.lines.join('\n');
  }
}

// Builder Pattern Implementation for Web Pages Integration

/**
 * Builder class for constructing HTML with RSL integration
 */
class WebPagesBuilder {
  private lines: string[] = [];
  private indentLevel: number = 0;

  private indent(): string {
    return '  '.repeat(Math.max(0, this.indentLevel));
  }

  private addLine(content: string): this {
    this.lines.push(this.indent() + content);
    return this;
  }

  private addComment(comment: string): this {
    return this.addLine(`<!-- ${comment} -->`);
  }

  startHtmlHead(): this {
    this.addLine('<head>');
    this.indentLevel++;
    return this;
  }

  addEmbeddedLicense(rslContent: string): this {
    this.addComment('RSL License - Embedded');
    this.addLine('<script type="application/rsl+xml">');
    this.indentLevel++;
    // Add the RSL content with proper indentation
    rslContent.split('\n').forEach(line => {
      if (line.trim()) {
        this.addLine(line.trim());
      }
    });
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</script>');
    return this;
  }

  addLinkedLicense(licenseUrl: string): this {
    this.addComment('RSL License - Linked');
    this.addLine(`<link rel="license"`);
    this.addLine(`      type="application/rsl+xml"`);
    this.addLine(`      href="${licenseUrl}">`);
    return this;
  }

  addMetaTags(): this {
    this.addComment('Your existing meta tags');
    this.addLine('<meta charset="UTF-8">');
    this.addLine('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    this.addLine('<title>Your Page Title</title>');
    return this;
  }

  endHtmlHead(): this {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</head>');
    return this;
  }

  build(): string {
    return this.lines.join('\n');
  }
}

// Builder Pattern Implementation for Media Files Integration

/**
 * Builder class for constructing media file RSL metadata
 */
class MediaFilesBuilder {
  private lines: string[] = [];
  private indentLevel: number = 0;

  private indent(): string {
    return '  '.repeat(Math.max(0, this.indentLevel));
  }

  private addLine(content: string): this {
    this.lines.push(this.indent() + content);
    return this;
  }

  private addComment(comment: string): this {
    return this.addLine(`<!-- ${comment} -->`);
  }

  startImageXmp(): this {
    this.addLine('<x:xmpmeta xmlns:x="adobe:ns:meta/">');
    this.indentLevel++;
    this.addLine('<rdf:RDF');
    this.indentLevel++;
    this.addLine('xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"');
    this.addLine('xmlns:rsl="https://rslstandard.org/rsl">');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('');
    this.addLine('<rdf:Description rdf:about="">');
    this.indentLevel++;
    return this;
  }

  startEpubPackage(): this {
    this.addLine('<package version="3.0"');
    this.indentLevel++;
    this.addLine('xmlns="http://www.idpf.org/2007/opf"');
    this.addLine('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    this.addLine('xmlns:rsl="https://rslstandard.org/rsl"');
    this.addLine('unique-identifier="BookID">');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('');
    this.addLine('<metadata>');
    this.indentLevel++;
    this.addComment('Your existing metadata');
    this.addLine('<dc:title>Your Book Title</dc:title>');
    this.addLine('<dc:creator>Your Name</dc:creator>');
    this.addLine('');
    return this;
  }

  addRslContent(rslXml: string, canonicalUrl: string, licenseServer?: string): this {
    // For EPUB format
    this.addLine('<rsl:rsl>');
    this.indentLevel++;
    this.addLine(`<rsl:content url="${canonicalUrl}"${licenseServer ? ` server="${licenseServer}"` : ''}>`);
    this.indentLevel++;
    
    // Parse and add RSL license content (simplified)
    this.addLine('<rsl:license>');
    this.indentLevel++;
    this.addLine('<rsl:permits type="usage">read</rsl:permits>');
    this.addLine('<rsl:payment type="free"/>');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</rsl:license>');
    
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</rsl:content>');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</rsl:rsl>');
    
    return this;
  }

  endEpubPackage(): this {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</metadata>');
    this.addLine('</package>');
    return this;
  }

  endImageXmp(): this {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</rdf:Description>');
    this.addLine('');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</rdf:RDF>');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    this.addLine('</x:xmpmeta>');
    return this;
  }

  build(): string {
    return this.lines.join('\n');
  }
}

// Strategy Pattern Implementation for robots.txt Generation

/**
 * Interface for robots.txt generation strategies
 */
interface RobotsGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RobotsIntegrationOptions): string;
}

/**
 * Template robots.txt strategy - generates robots.txt with RSL License directive
 */
class TemplateRobotsStrategy implements RobotsGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RobotsIntegrationOptions): string {
    const builder = new RobotsBuilder();
    
    // Add header comment
    builder.addComment('robots.txt with RSL licensing information');
    
    // Add License directive - this is the key RSL integration
    const licenseUrl = options.licenseUrl || `${options.websiteUrl || 'https://yourwebsite.com'}/license.xml`;
    builder.addLicenseDirective(licenseUrl);
    
    // Add empty line for separation
    builder.addEmptyLine();
    
    // Add template user agent rules
    builder.addComment('Your existing robots.txt directives');
    builder.addUserAgent('*');
    builder.addComment('Add your Disallow/Allow rules here');
    builder.addDisallow('/admin/');
    builder.addDisallow('/private/');
    
    // Add custom directives if provided
    if (options.customDirectives?.length) {
      builder.addEmptyLine();
      builder.addComment('Custom directives');
      options.customDirectives.forEach(directive => {
        builder.addCustomDirective(directive);
      });
    }
    
    // Add sitemap if website URL provided
    if (options.websiteUrl) {
      builder.addEmptyLine();
      builder.addSitemap(`${options.websiteUrl}/sitemap.xml`);
    }
    
    return builder.build();
  }
}

/**
 * Basic robots.txt strategy - minimal robots.txt with just License directive
 */
class BasicRobotsStrategy implements RobotsGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: RobotsIntegrationOptions): string {
    const builder = new RobotsBuilder();
    
    // Add License directive only
    const licenseUrl = options.licenseUrl || `${options.websiteUrl || 'https://yourwebsite.com'}/license.xml`;
    builder.addLicenseDirective(licenseUrl);
    
    // Add basic user agent rule
    builder.addEmptyLine();
    builder.addUserAgent('*');
    builder.addDisallow('');
    
    return builder.build();
  }
}

// Strategy Pattern Implementation for Web Pages Generation

/**
 * Interface for web pages generation strategies
 */
interface WebPagesGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: WebPagesIntegrationOptions): string;
}

/**
 * Embedded web pages strategy - generates HTML head with embedded RSL
 */
class EmbeddedWebPagesStrategy implements WebPagesGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: WebPagesIntegrationOptions): string {
    const builder = new WebPagesBuilder();
    
    builder.startHtmlHead();
    builder.addMetaTags();
    
    // Generate simple RSL content for the page
    const rslXml = this.generatePageRslContent(options);
    builder.addEmbeddedLicense(rslXml);
    
    builder.endHtmlHead();
    
    return builder.build();
  }

  private generatePageRslContent(options: WebPagesIntegrationOptions): string {
    const licenseServer = options.licenseServer || 'https://rslcollective.org/api';
    
    return `<rsl xmlns="https://rslstandard.org/rsl">
  <content url=""${options.licenseServer ? ` server="${licenseServer}"` : ''}>
    <license>
      <permits type="usage">ai-train</permits>
      <payment type="royalty">
        <standard>https://rslcollective.org/license</standard>
      </payment>
    </license>
  </content>
</rsl>`;
  }
}

/**
 * Linked web pages strategy - generates HTML head with linked RSL
 */
class LinkedWebPagesStrategy implements WebPagesGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: WebPagesIntegrationOptions): string {
    const builder = new WebPagesBuilder();
    
    builder.startHtmlHead();
    builder.addMetaTags();
    
    const licenseUrl = `${options.websiteUrl || 'https://example.com'}/license.xml`;
    builder.addLinkedLicense(licenseUrl);
    
    builder.endHtmlHead();
    
    return builder.build();
  }
}

// Strategy Pattern Implementation for Media Files Generation

/**
 * Interface for media files generation strategies
 */
interface MediaFilesGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: MediaFilesIntegrationOptions): string;
}

/**
 * EPUB media files strategy - generates EPUB OPF metadata with RSL
 */
class EpubMediaFilesStrategy implements MediaFilesGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: MediaFilesIntegrationOptions): string {
    const builder = new MediaFilesBuilder();
    
    builder.startEpubPackage();
    
    const canonicalUrl = options.canonicalUrl || `${options.websiteUrl || 'https://example.com'}/book.epub`;
    builder.addRslContent('', canonicalUrl, options.licenseServer);
    
    builder.endEpubPackage();
    
    return builder.build();
  }
}

/**
 * Image media files strategy - generates XMP metadata with RSL
 */
class ImageMediaFilesStrategy implements MediaFilesGenerationStrategy {
  generate(rslContents: import('./rsl-generator').RslContent[], options: MediaFilesIntegrationOptions): string {
    const builder = new MediaFilesBuilder();
    
    builder.startImageXmp();
    
    const canonicalUrl = options.canonicalUrl || `${options.websiteUrl || 'https://example.com'}/image.jpg`;
    builder.addRslContent('', canonicalUrl, options.licenseServer);
    
    builder.endImageXmp();
    
    return builder.build();
  }
}

// Factory Pattern Implementation for RSS Integration Types

/**
 * Abstract base class for RSS integration factories
 */
abstract class RssIntegrationFactory {
  abstract createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RssIntegrationOptions): string;
  
  protected getDefaultOptions(): RssIntegrationOptions {
    return {
      title: 'Your Website - Latest Articles',
      link: 'https://yourwebsite.com',
      description: 'Latest articles and content from your website',
      maxItems: 10,
      includeMetadata: true
    };
  }
}

/**
 * Factory for creating full RSS documents
 */
class FullRssFactory extends RssIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RssIntegrationOptions): string {
    const strategy = new FullRssDocumentStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Factory for creating template RSS with ellipsis
 */
class TemplateRssFactory extends RssIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RssIntegrationOptions): string {
    const strategy = new TemplateRssStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options, maxItems: 2 };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Factory for creating RSL content blocks only
 */
class RslContentFactory extends RssIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RssIntegrationOptions): string {
    const strategy = new RslOnlyStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Main factory manager for RSS integration
 */
export class RssIntegrationManager {
  private static factories = new Map<string, RssIntegrationFactory>([
    ['full', new FullRssFactory()],
    ['template', new TemplateRssFactory()],
    ['rsl-only', new RslContentFactory()],
  ]);

  static createIntegration(
    type: 'full' | 'template' | 'rsl-only',
    rslContents: import('./rsl-generator').RslContent[],
    options?: RssIntegrationOptions
  ): string {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown RSS integration type: ${type}`);
    }
    return factory.createIntegration(rslContents, options);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Factory Pattern Implementation for robots.txt Integration

/**
 * Abstract base class for robots.txt integration factories
 */
abstract class RobotsIntegrationFactory {
  abstract createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RobotsIntegrationOptions): string;
  
  protected getDefaultOptions(): RobotsIntegrationOptions {
    return {
      websiteUrl: 'https://yourwebsite.com',
      licenseUrl: undefined, // Will be auto-generated
      includeUserAgents: true,
      customDirectives: []
    };
  }
}

/**
 * Factory for creating template robots.txt files
 */
class TemplateRobotsFactory extends RobotsIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RobotsIntegrationOptions): string {
    const strategy = new TemplateRobotsStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Factory for creating basic robots.txt files
 */
class BasicRobotsFactory extends RobotsIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: RobotsIntegrationOptions): string {
    const strategy = new BasicRobotsStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Main factory manager for robots.txt integration
 */
export class RobotsIntegrationManager {
  private static factories = new Map<string, RobotsIntegrationFactory>([
    ['template', new TemplateRobotsFactory()],
    ['basic', new BasicRobotsFactory()],
  ]);

  static createIntegration(
    type: 'template' | 'basic',
    rslContents: import('./rsl-generator').RslContent[],
    options?: RobotsIntegrationOptions
  ): string {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown robots.txt integration type: ${type}`);
    }
    return factory.createIntegration(rslContents, options);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Factory Pattern Implementation for Web Pages Integration

/**
 * Abstract base class for web pages integration factories
 */
abstract class WebPagesIntegrationFactory {
  abstract createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: WebPagesIntegrationOptions): string;
  
  protected getDefaultOptions(): WebPagesIntegrationOptions {
    return {
      websiteUrl: 'https://yourwebsite.com',
      licenseServer: 'https://rslcollective.org/api',
      integrationType: 'embedded',
      includeTemplate: true
    };
  }
}

/**
 * Factory for creating embedded web pages integration
 */
class EmbeddedWebPagesFactory extends WebPagesIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: WebPagesIntegrationOptions): string {
    const strategy = new EmbeddedWebPagesStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Factory for creating linked web pages integration
 */
class LinkedWebPagesFactory extends WebPagesIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: WebPagesIntegrationOptions): string {
    const strategy = new LinkedWebPagesStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Main factory manager for web pages integration
 */
export class WebPagesIntegrationManager {
  private static factories = new Map<string, WebPagesIntegrationFactory>([
    ['embedded', new EmbeddedWebPagesFactory()],
    ['linked', new LinkedWebPagesFactory()],
  ]);

  static createIntegration(
    type: 'embedded' | 'linked',
    rslContents: import('./rsl-generator').RslContent[],
    options?: WebPagesIntegrationOptions
  ): string {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown web pages integration type: ${type}`);
    }
    return factory.createIntegration(rslContents, options);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Factory Pattern Implementation for Media Files Integration

/**
 * Abstract base class for media files integration factories
 */
abstract class MediaFilesIntegrationFactory {
  abstract createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: MediaFilesIntegrationOptions): string;
  
  protected getDefaultOptions(): MediaFilesIntegrationOptions {
    return {
      websiteUrl: 'https://yourwebsite.com',
      licenseServer: 'https://rslcollective.org/api',
      fileType: 'generic',
      canonicalUrl: undefined
    };
  }
}

/**
 * Factory for creating EPUB media files integration
 */
class EpubMediaFilesFactory extends MediaFilesIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: MediaFilesIntegrationOptions): string {
    const strategy = new EpubMediaFilesStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options, fileType: 'epub' as const };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Factory for creating image media files integration
 */
class ImageMediaFilesFactory extends MediaFilesIntegrationFactory {
  createIntegration(rslContents: import('./rsl-generator').RslContent[], options?: MediaFilesIntegrationOptions): string {
    const strategy = new ImageMediaFilesStrategy();
    const mergedOptions = { ...this.getDefaultOptions(), ...options, fileType: 'image' as const };
    return strategy.generate(rslContents, mergedOptions);
  }
}

/**
 * Main factory manager for media files integration
 */
export class MediaFilesIntegrationManager {
  private static factories = new Map<string, MediaFilesIntegrationFactory>([
    ['epub', new EpubMediaFilesFactory()],
    ['image', new ImageMediaFilesFactory()],
  ]);

  static createIntegration(
    type: 'epub' | 'image',
    rslContents: import('./rsl-generator').RslContent[],
    options?: MediaFilesIntegrationOptions
  ): string {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown media files integration type: ${type}`);
    }
    return factory.createIntegration(rslContents, options);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Validation for RSS Integration

/**
 * Interface for RSS validation strategies
 */
interface RssValidationStrategy {
  validate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions): RssValidationResult[];
}

/**
 * RSS validation result interface
 */
interface RssValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  context?: string;
}

/**
 * Basic RSS validation strategy
 */
class BasicRssValidationStrategy implements RssValidationStrategy {
  validate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions): RssValidationResult[] {
    const results: RssValidationResult[] = [];

    if (rslContents.length === 0) {
      results.push({
        type: 'warning',
        message: 'No RSL content provided - will generate fallback RSS structure'
      });
    }

    rslContents.forEach((content, index) => {
      if (!content.url) {
        results.push({
          type: 'error',
          message: `Content at index ${index} is missing URL`,
          context: `Content ${index + 1}`
        });
      }

      if (!content.rsl.licenses || content.rsl.licenses.length === 0) {
        results.push({
          type: 'warning',
          message: `Content "${content.url}" has no licenses - will be excluded from RSS`,
          context: content.url
        });
      }
    });

    return results;
  }
}

/**
 * RSS validator class
 */
export class RssValidator {
  private strategy: RssValidationStrategy;

  constructor(strategy: RssValidationStrategy = new BasicRssValidationStrategy()) {
    this.strategy = strategy;
  }

  validate(rslContents: import('./rsl-generator').RslContent[], options: RssIntegrationOptions = {}): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    results: RssValidationResult[];
  } {
    const results = this.strategy.validate(rslContents, options);

    const errors = results.filter(r => r.type === 'error').map(r => r.message);
    const warnings = results.filter(r => r.type === 'warning').map(r => r.message);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      results
    };
  }
}

// Convenience Functions (Backward Compatibility)

/**
 * Generates RSS feed with RSL integration using template strategy
 */
export function generateRssWithRsl(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RssIntegrationOptions
): string {
  return RssIntegrationManager.createIntegration('template', rslContents, options);
}

/**
 * Generates full RSS document with RSL integration
 */
export function generateFullRssDocument(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RssIntegrationOptions
): string {
  return RssIntegrationManager.createIntegration('full', rslContents, options);
}

/**
 * Generates only RSL content blocks for integration
 */
export function generateRslContentBlocks(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RssIntegrationOptions
): string {
  return RssIntegrationManager.createIntegration('rsl-only', rslContents, options);
}

/**
 * Validates RSS integration before generation
 */
export function validateRssIntegration(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RssIntegrationOptions
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const validator = new RssValidator();
  const result = validator.validate(rslContents, options || {});
  
  return {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings
  };
}

// Helper Functions for RSS Integration

/**
 * Extracts RSL content from crawled links for RSS integration
 */
export function extractRslContentFromLinks(crawledLinks: Array<{
  url: string;
  selected: boolean;
  formData?: {
    rsl?: import('./rsl-generator').RslData;
  };
}>): import('./rsl-generator').RslContent[] {
  return crawledLinks
    .filter(link => link.selected && link.formData?.rsl)
    .map(link => ({
      url: link.url,
      rsl: link.formData!.rsl!
    }));
}

/**
 * Creates RSS integration options from website configuration
 */
export function createRssOptionsFromWebsite(
  websiteUrl: string,
  title?: string,
  description?: string
): RssIntegrationOptions {
  return {
    title: title || `${new URL(websiteUrl).hostname} - Latest Articles`,
    link: websiteUrl,
    description: description || `Latest articles and content from ${new URL(websiteUrl).hostname}`,
    maxItems: 10,
    includeMetadata: true
  };
}

// Convenience Functions for robots.txt Integration

/**
 * Generates robots.txt with RSL License directive using template strategy
 */
export function generateRobotsWithRsl(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RobotsIntegrationOptions
): string {
  return RobotsIntegrationManager.createIntegration('template', rslContents, options);
}

/**
 * Generates basic robots.txt with RSL License directive
 */
export function generateBasicRobots(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RobotsIntegrationOptions
): string {
  return RobotsIntegrationManager.createIntegration('basic', rslContents, options);
}

/**
 * Creates robots.txt integration options from website configuration
 */
export function createRobotsOptionsFromWebsite(
  websiteUrl: string,
  customDirectives?: string[]
): RobotsIntegrationOptions {
  return {
    websiteUrl,
    licenseUrl: `${websiteUrl}/license.xml`,
    includeUserAgents: true,
    customDirectives: customDirectives || []
  };
}

/**
 * Validates robots.txt integration before generation
 */
export function validateRobotsIntegration(
  rslContents: import('./rsl-generator').RslContent[],
  options?: RobotsIntegrationOptions
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!options?.websiteUrl) {
    warnings.push('No website URL provided - using default placeholder');
  }

  if (!options?.licenseUrl && !options?.websiteUrl) {
    errors.push('Either licenseUrl or websiteUrl must be provided');
  }

  if (rslContents.length === 0) {
    warnings.push('No RSL content provided - robots.txt will only contain License directive');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Convenience Functions for Web Pages Integration

/**
 * Generates HTML head with embedded RSL license
 */
export function generateWebPagesWithEmbeddedRsl(
  rslContents: import('./rsl-generator').RslContent[],
  options?: WebPagesIntegrationOptions
): string {
  return WebPagesIntegrationManager.createIntegration('embedded', rslContents, options);
}

/**
 * Generates HTML head with linked RSL license
 */
export function generateWebPagesWithLinkedRsl(
  rslContents: import('./rsl-generator').RslContent[],
  options?: WebPagesIntegrationOptions
): string {
  return WebPagesIntegrationManager.createIntegration('linked', rslContents, options);
}

/**
 * Creates web pages integration options from website configuration
 */
export function createWebPagesOptionsFromWebsite(
  websiteUrl: string,
  integrationType: 'embedded' | 'linked' = 'embedded'
): WebPagesIntegrationOptions {
  return {
    websiteUrl,
    licenseServer: 'https://rslcollective.org/api',
    integrationType,
    includeTemplate: true
  };
}

// Convenience Functions for Media Files Integration

/**
 * Generates EPUB metadata with RSL license
 */
export function generateEpubWithRsl(
  rslContents: import('./rsl-generator').RslContent[],
  options?: MediaFilesIntegrationOptions
): string {
  return MediaFilesIntegrationManager.createIntegration('epub', rslContents, options);
}

/**
 * Generates image XMP metadata with RSL license
 */
export function generateImageWithRsl(
  rslContents: import('./rsl-generator').RslContent[],
  options?: MediaFilesIntegrationOptions
): string {
  return MediaFilesIntegrationManager.createIntegration('image', rslContents, options);
}

/**
 * Creates media files integration options from website configuration
 */
export function createMediaFilesOptionsFromWebsite(
  websiteUrl: string,
  fileType: 'epub' | 'image' = 'epub',
  canonicalUrl?: string
): MediaFilesIntegrationOptions {
  return {
    websiteUrl,
    licenseServer: 'https://rslcollective.org/api',
    fileType,
    canonicalUrl: canonicalUrl || `${websiteUrl}/media-file`
  };
}
