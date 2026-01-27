/**
 * URL Metadata Scraper API
 *
 * Extracts metadata from web pages using:
 * 1. OpenGraph meta tags
 * 2. Twitter card meta tags
 * 3. Schema.org JSON-LD
 * 4. Standard HTML meta tags
 */

import { NextRequest, NextResponse } from 'next/server';

interface MetadataResult {
  title?: string;
  description?: string;
  author?: string;
  authors?: string[];
  publishedDate?: string;
  modifiedDate?: string;
  siteName?: string;
  url?: string;
  image?: string;
  type?: string;
  publisher?: string;
  // Additional fields for citation
  articleSection?: string;
  wordCount?: number;
  keywords?: string[];
}

interface APIResponse {
  success: boolean;
  data?: MetadataResult;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the page with browser-like headers
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Provide more helpful error messages
      let errorMessage = `Failed to fetch URL: ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'This website requires authentication or blocks automated access. Please use Manual Entry instead.';
      } else if (response.status === 404) {
        errorMessage = 'Page not found. Please check the URL.';
      } else if (response.status >= 500) {
        errorMessage = 'The website is currently unavailable. Please try again later.';
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 502 }
      );
    }

    const html = await response.text();
    const metadata = parseMetadata(html, parsedUrl.toString());

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('URL lookup error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process URL' },
      { status: 500 }
    );
  }
}

/**
 * Parse metadata from HTML content
 */
function parseMetadata(html: string, url: string): MetadataResult {
  const metadata: MetadataResult = { url };

  // Extract meta tags using regex (avoiding DOM parser for serverless)
  const metaTags = extractMetaTags(html);

  // OpenGraph metadata (highest priority for social sharing)
  metadata.title = metaTags['og:title'];
  metadata.description = metaTags['og:description'];
  metadata.siteName = metaTags['og:site_name'];
  metadata.image = metaTags['og:image'];
  metadata.type = metaTags['og:type'];
  metadata.publishedDate = metaTags['article:published_time'];
  metadata.modifiedDate = metaTags['article:modified_time'];
  metadata.author = metaTags['article:author'];
  metadata.articleSection = metaTags['article:section'];

  // Twitter card fallbacks
  if (!metadata.title) metadata.title = metaTags['twitter:title'];
  if (!metadata.description) metadata.description = metaTags['twitter:description'];
  if (!metadata.image) metadata.image = metaTags['twitter:image'];

  // Standard meta tags fallbacks
  if (!metadata.title) metadata.title = extractTitle(html);
  if (!metadata.description) metadata.description = metaTags.description;
  if (!metadata.author) metadata.author = metaTags.author;
  if (!metadata.publishedDate) metadata.publishedDate = metaTags.date || metaTags.pubdate;
  if (!metadata.keywords) {
    const {keywords} = metaTags;
    if (keywords) {
      metadata.keywords = keywords.split(',').map((k: string) => k.trim());
    }
  }

  // Try to extract JSON-LD schema data
  const schemaData = extractJsonLd(html);
  if (schemaData) {
    if (!metadata.title && typeof schemaData.headline === 'string') {
      metadata.title = schemaData.headline;
    }
    if (!metadata.description && typeof schemaData.description === 'string') {
      metadata.description = schemaData.description;
    }
    if (!metadata.publishedDate && typeof schemaData.datePublished === 'string') {
      metadata.publishedDate = schemaData.datePublished;
    }
    if (!metadata.modifiedDate && typeof schemaData.dateModified === 'string') {
      metadata.modifiedDate = schemaData.dateModified;
    }
    if (schemaData.author) {
      if (Array.isArray(schemaData.author)) {
        metadata.authors = schemaData.author.map((a: unknown) =>
          typeof a === 'string' ? a : (a as { name?: string })?.name
        ).filter((x): x is string => typeof x === 'string');
        if (!metadata.author && metadata.authors.length > 0) {
          metadata.author = metadata.authors[0];
        }
      } else if (typeof schemaData.author === 'object' && schemaData.author !== null) {
        const authorObj = schemaData.author as { name?: string };
        if (typeof authorObj.name === 'string') {
          metadata.author = authorObj.name;
        }
      } else if (typeof schemaData.author === 'string') {
        metadata.author = schemaData.author;
      }
    }
    if (schemaData.publisher) {
      if (typeof schemaData.publisher === 'object' && schemaData.publisher !== null) {
        const publisherObj = schemaData.publisher as { name?: string };
        if (typeof publisherObj.name === 'string') {
          metadata.publisher = publisherObj.name;
        }
      } else if (typeof schemaData.publisher === 'string') {
        metadata.publisher = schemaData.publisher;
      }
    }
    if (typeof schemaData.wordCount === 'number') {
      metadata.wordCount = schemaData.wordCount;
    }
  }

  // Clean up undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as MetadataResult;
}

/**
 * Extract meta tags from HTML using regex
 */
function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};

  // Match meta tags with name or property attributes
  const metaRegex = /<meta\s+(?:[^>]*?\s+)?(?:name|property)=["']([^"']+)["']\s+(?:[^>]*?\s+)?content=["']([^"']*)["'][^>]*>/gi;
  const metaRegexAlt = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["']\s+(?:[^>]*?\s+)?(?:name|property)=["']([^"']+)["'][^>]*>/gi;

  let match;

  while ((match = metaRegex.exec(html)) !== null) {
    tags[match[1].toLowerCase()] = decodeHtmlEntities(match[2]);
  }

  while ((match = metaRegexAlt.exec(html)) !== null) {
    tags[match[2].toLowerCase()] = decodeHtmlEntities(match[1]);
  }

  return tags;
}

/**
 * Extract page title from HTML
 */
function extractTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return decodeHtmlEntities(titleMatch[1].trim());
  }
  return undefined;
}

/**
 * Extract JSON-LD schema data from HTML
 */
function extractJsonLd(html: string): Record<string, unknown> | null {
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // Handle @graph arrays
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        // Find Article or NewsArticle type
        const article = data['@graph'].find(
          (item: { '@type'?: string | string[] }) =>
            item['@type'] === 'Article' ||
            item['@type'] === 'NewsArticle' ||
            item['@type'] === 'BlogPosting' ||
            item['@type'] === 'WebPage' ||
            (Array.isArray(item['@type']) &&
              (item['@type'].includes('Article') || item['@type'].includes('NewsArticle')))
        );
        if (article) return article;
      }

      // Check if this is an article/webpage type
      if (
        data['@type'] === 'Article' ||
        data['@type'] === 'NewsArticle' ||
        data['@type'] === 'BlogPosting' ||
        data['@type'] === 'WebPage' ||
        data['@type'] === 'Book' ||
        (Array.isArray(data['@type']) &&
          (data['@type'].includes('Article') || data['@type'].includes('NewsArticle')))
      ) {
        return data;
      }
    } catch {
      // Invalid JSON, continue to next script tag
      continue;
    }
  }

  return null;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#8211;': '\u2013',
    '&#8212;': '\u2014',
    '&#8216;': '\u2018',
    '&#8217;': '\u2019',
    '&#8220;': '\u201C',
    '&#8221;': '\u201D',
  };

  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

// Also support GET for simple testing
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Create a mock request and delegate to POST
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });

  return POST(mockRequest);
}
