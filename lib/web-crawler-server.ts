// Server-side web crawling functions using Crawlee (Node.js only)
import { CheerioCrawler, createCheerioRouter } from '@crawlee/cheerio';
import { Configuration } from 'crawlee';
import { 
  type CrawlOptions, 
  type CrawledPage, 
  type CrawlResult, 
  type SitemapEntry,
  normalizeUrl,
  validateUrl,
  extractDomain,
  isUrlExcluded 
} from './web-crawler-utils';

/**
 * Crawls a website using Cheerio and discovers URLs
 */
export async function crawlWebsite(
  baseUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const startTime = Date.now();
  const {
    maxPages = 100,
    maxDepth = 3,
    excludePatterns = [],
    timeout = 30000,
    userAgent = "RSL-Editor/1.0"
  } = options;

  try {
    // Normalize the base URL
    const normalizedBaseUrl = normalizeUrl(baseUrl);
    
    // Validate the URL
    const validation = await validateUrl(normalizedBaseUrl);
    if (!validation.isValid) {
      return {
        success: false,
        baseUrl: normalizedBaseUrl,
        pages: [],
        errors: [validation.error || "Invalid URL"],
        totalPages: 0,
        totalSize: 0,
        crawlTime: Date.now() - startTime,
      };
    }

    const pages: CrawledPage[] = [];
    const errors: string[] = [];
    
    // Configure Crawlee to not persist any data to disk
    const config = new Configuration({
      persistStorage: false,
      purgeOnStart: true,
      storageClientOptions: {
        localDataDirectory: undefined, // Don't create any local directories
      },
    });
    
    const router = createCheerioRouter();
    
    router.addDefaultHandler(async ({ $, request, enqueueLinks, log, body }) => {
      try {
        // Check if URL should be excluded
        if (isUrlExcluded(request.loadedUrl || request.url, excludePatterns)) {
          log.info(`Excluding URL: ${request.loadedUrl || request.url}`);
          return;
        }

        // Extract page information using Cheerio
        const title = $('title').text().trim() || '';
        const description = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') ||
                          '';
        
        // Get content size
        const size = Buffer.byteLength(body, 'utf8');
        
        const crawledPage: CrawledPage = {
          url: request.loadedUrl || request.url,
          title: title || undefined,
          description: description || undefined,
          statusCode: 200,
          contentType: 'text/html',
          lastModified: new Date().toISOString(),
          size,
        };

        pages.push(crawledPage);

        // Continue crawling if within limits and depth
        const currentDepth = request.userData?.depth || 0;
        if (pages.length < maxPages && currentDepth < maxDepth) {
          await enqueueLinks({
            selector: 'a[href]',
            regexps: [new RegExp(`^${normalizedBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)],
            userData: { depth: currentDepth + 1 },
          });
        }

        log.info(`Crawled: ${request.loadedUrl || request.url} (${title}) - Depth: ${currentDepth}`);
      } catch (error) {
        const errorMsg = `Failed to crawl ${request.loadedUrl || request.url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        log.error(errorMsg);
      }
    });

    const crawler = new CheerioCrawler({
      requestHandler: router,
      maxRequestsPerCrawl: maxPages,
      requestHandlerTimeoutSecs: timeout / 1000,
      additionalMimeTypes: ['text/html', 'application/xhtml+xml'],
      additionalHttpErrorStatusCodes: [404, 403, 401, 500],
      preNavigationHooks: [
        async ({ request }) => {
          request.headers = {
            ...request.headers,
            'User-Agent': userAgent,
          };
        },
      ],
    }, config);

    // Start crawling
    await crawler.run([normalizedBaseUrl]);

    const totalSize = pages.reduce((sum, page) => sum + (page.size || 0), 0);

    return {
      success: true,
      baseUrl: normalizedBaseUrl,
      pages,
      errors,
      totalPages: pages.length,
      totalSize,
      crawlTime: Date.now() - startTime,
    };

  } catch (error) {
    return {
      success: false,
      baseUrl: baseUrl,
      pages: [],
      errors: [error instanceof Error ? error.message : "Unknown crawling error"],
      totalPages: 0,
      totalSize: 0,
      crawlTime: Date.now() - startTime,
    };
  }
}

/**
 * Parses a sitemap XML and extracts URLs
 */
export async function parseSitemap(sitemapUrl: string): Promise<{
  success: boolean;
  entries: SitemapEntry[];
  errors: string[];
}> {
  try {
    // Validate sitemap URL
    const validation = await validateUrl(sitemapUrl);
    if (!validation.isValid) {
      return {
        success: false,
        entries: [],
        errors: [validation.error || "Invalid sitemap URL"],
      };
    }

    // In a real implementation, this would fetch and parse the actual sitemap XML
    // For now, we'll simulate some sitemap entries
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const domain = extractDomain(sitemapUrl);
    const mockEntries: SitemapEntry[] = [
      { url: `https://${domain}/`, lastmod: new Date().toISOString(), priority: "1.0" },
      { url: `https://${domain}/about`, lastmod: new Date(Date.now() - 86400000).toISOString(), priority: "0.8" },
      { url: `https://${domain}/contact`, lastmod: new Date(Date.now() - 172800000).toISOString(), priority: "0.6" },
      { url: `https://${domain}/blog`, lastmod: new Date(Date.now() - 43200000).toISOString(), priority: "0.9" },
    ];

    return {
      success: true,
      entries: mockEntries,
      errors: [],
    };

  } catch (error) {
    return {
      success: false,
      entries: [],
      errors: [error instanceof Error ? error.message : "Failed to parse sitemap"],
    };
  }
}

/**
 * Crawls a single URL and returns page information using Cheerio
 */
export async function crawlSingleUrl(url: string): Promise<CrawledPage> {
  try {
    const normalizedUrl = normalizeUrl(url);
    const validation = await validateUrl(normalizedUrl);
    
    if (!validation.isValid) {
      return {
        url: normalizedUrl,
        error: validation.error || "Invalid URL",
      };
    }

    // Configure Crawlee to not persist any data to disk
    const config = new Configuration({
      persistStorage: false,
      purgeOnStart: true,
      storageClientOptions: {
        localDataDirectory: undefined, // Don't create any local directories
      },
    });

    const router = createCheerioRouter();
    let result: CrawledPage | null = null;

    router.addDefaultHandler(async ({ $, request, body }) => {
      try {
        // Extract page information using Cheerio
        const title = $('title').text().trim() || '';
        const description = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') ||
                          '';
        
        // Get content size
        const size = Buffer.byteLength(body, 'utf8');
        
        result = {
          url: request.loadedUrl || request.url,
          title: title || undefined,
          description: description || undefined,
          statusCode: 200,
          contentType: 'text/html',
          lastModified: new Date().toISOString(),
          size,
        };
      } catch (error) {
        result = {
          url: normalizedUrl,
          error: error instanceof Error ? error.message : "Failed to extract page data",
        };
      }
    });

    const crawler = new CheerioCrawler({
      requestHandler: router,
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 30,
      preNavigationHooks: [
        async ({ request }) => {
          request.headers = {
            ...request.headers,
            'User-Agent': "RSL-Editor/1.0",
          };
        },
      ],
    }, config);

    await crawler.run([normalizedUrl]);

    return result || {
      url: normalizedUrl,
      error: "No data extracted from page",
    };

  } catch (error) {
    return {
      url,
      error: error instanceof Error ? error.message : "Failed to crawl URL",
    };
  }
}
