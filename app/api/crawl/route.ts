import { NextRequest, NextResponse } from 'next/server';
import { crawlWebsite, crawlSingleUrl, parseSitemap } from '@/lib/web-crawler-server';
import { type CrawlOptions, formatCrawlResults } from '@/lib/web-crawler-utils';

// Client-side link structure that the UI expects
interface CrawledLink {
  id: string;
  url: string;
  status: "crawling" | "completed" | "failed";
  isNew?: boolean;
  selected: boolean;
  title?: string;
  description?: string;
  size?: number;
  lastModified?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      url, 
      crawlType = 'crawl', 
      options = {} 
    }: { 
      url: string; 
      crawlType: 'crawl' | 'sitemap' | 'individual'; 
      options: CrawlOptions 
    } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    let result;

    switch (crawlType) {
      case 'sitemap':
        const sitemapResult = await parseSitemap(url);
        result = {
          success: sitemapResult.success,
          baseUrl: url,
          pages: sitemapResult.entries.map(entry => ({
            url: entry.url,
            title: 'Page from sitemap',
            lastModified: entry.lastmod,
            statusCode: 200,
          })),
          errors: sitemapResult.errors,
          totalPages: sitemapResult.entries.length,
          totalSize: 0,
          crawlTime: 0,
        };
        break;

      case 'individual':
        const page = await crawlSingleUrl(url);
        result = {
          success: !page.error,
          baseUrl: url,
          pages: page.error ? [] : [page],
          errors: page.error ? [page.error] : [],
          totalPages: page.error ? 0 : 1,
          totalSize: page.size || 0,
          crawlTime: 0,
        };
        break;

      case 'crawl':
      default:
        result = await crawlWebsite(url, options);
        break;
    }

    // Transform crawl result into client-side link format
    const links: CrawledLink[] = result.pages.map((page, index) => ({
      id: `page-${index}`,
      url: page.url,
      status: page.error ? "failed" : "completed",
      isNew: true,
      selected: false,
      title: page.title,
      description: page.description,
      size: page.size,
      lastModified: page.lastModified,
    }));

    return NextResponse.json({
      success: result.success,
      links,
      summary: {
        totalPages: result.totalPages,
        totalSize: result.totalSize,
        crawlTime: result.crawlTime,
        baseUrl: result.baseUrl,
        message: formatCrawlResults(result),
      },
      errors: result.errors,
    });

  } catch (error) {
    console.error('Crawling API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        links: [],
        summary: null,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      },
      { status: 500 }
    );
  }
}
