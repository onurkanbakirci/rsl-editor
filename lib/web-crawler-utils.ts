// Client-safe utility functions for web crawling (no Node.js dependencies)

// Types for web crawling
export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  excludePatterns?: string[];
  timeout?: number;
  userAgent?: string;
}

export interface CrawledPage {
  url: string;
  title?: string;
  description?: string;
  statusCode?: number;
  contentType?: string;
  lastModified?: string;
  size?: number;
  error?: string;
}

export interface CrawlResult {
  success: boolean;
  baseUrl: string;
  pages: CrawledPage[];
  errors: string[];
  totalPages: number;
  totalSize: number;
  crawlTime: number;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Normalizes a URL by ensuring it has a protocol and removing trailing slashes
 */
export function normalizeUrl(url: string, protocol: string = "https"): string {
  // Remove protocol if present
  let cleanUrl = url.replace(/^https?:\/\//, "");
  
  // Remove trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, "");
  
  // Add protocol
  return `${protocol}://${cleanUrl}`;
}

/**
 * Validates if a URL is valid and reachable
 */
export async function validateUrl(url: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { isValid: false, error: "Only HTTP and HTTPS protocols are supported" };
    }

    // Simple reachability check (in a real implementation, you'd make an actual HTTP request)
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Invalid URL format" };
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

/**
 * Checks if URL matches any exclude pattern
 */
export function isUrlExcluded(url: string, excludePatterns: string[] = []): boolean {
  return excludePatterns.some(pattern => {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    
    const regex = new RegExp(regexPattern, "i");
    return regex.test(url);
  });
}

/**
 * Utility function to format crawl results for display
 */
export function formatCrawlResults(result: CrawlResult): string {
  const { success, totalPages, totalSize, crawlTime } = result;
  
  if (!success) {
    return `Crawl failed: ${result.errors.join(", ")}`;
  }

  const sizeInKB = (totalSize / 1024).toFixed(1);
  const timeInSeconds = (crawlTime / 1000).toFixed(1);
  
  return `Successfully crawled ${totalPages} pages (${sizeInKB} KB) in ${timeInSeconds}s`;
}
