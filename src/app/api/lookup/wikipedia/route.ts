/**
 * Wikipedia Lookup API
 *
 * Fetches article metadata from Wikipedia API for citation generation
 * No API key required
 */

import { NextRequest, NextResponse } from 'next/server';

interface WikipediaMetadataResult {
  title: string;
  siteName: string; // "Wikipedia" or language-specific
  url: string;
  accessDate: {
    year: number;
    month: number;
    day: number;
  };
  lastModified?: {
    year: number;
    month: number;
    day: number;
  };
  description?: string;
  language?: string;
  pageId?: number;
}

interface APIResponse {
  success: boolean;
  data?: WikipediaMetadataResult;
  error?: string;
}

interface WikiApiResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        revisions?: Array<{
          timestamp?: string;
        }>;
        extract?: string;
        pageprops?: {
          wikibase_item?: string;
          description?: string;
        };
      }
    >;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    const { url, title } = body;

    if (!url && !title) {
      return NextResponse.json(
        { success: false, error: 'Wikipedia URL or article title is required' },
        { status: 400 }
      );
    }

    // Extract article info from URL or use title directly
    let articleTitle: string;
    let language = 'en';

    if (url) {
      const parsed = parseWikipediaUrl(url);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: 'Invalid Wikipedia URL' },
          { status: 400 }
        );
      }
      articleTitle = parsed.title;
      language = parsed.language;
    } else {
      articleTitle = title;
    }

    // Fetch from Wikipedia API
    const apiUrl = `https://${language}.wikipedia.org/w/api.php`;
    const params = new URLSearchParams({
      action: 'query',
      titles: articleTitle,
      prop: 'revisions|extracts|pageprops',
      rvprop: 'timestamp',
      exintro: '1',
      explaintext: '1',
      exsentences: '3',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      headers: {
        'User-Agent': 'OpenCitation/1.0 (https://opencitation.com)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Wikipedia API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data: WikiApiResponse = await response.json();

    // Check if page was found
    const pages = data.query?.pages;
    if (!pages) {
      return NextResponse.json(
        { success: false, error: 'Wikipedia article not found' },
        { status: 404 }
      );
    }

    const pageIds = Object.keys(pages);
    if (pageIds.length === 0 || pageIds[0] === '-1') {
      return NextResponse.json(
        { success: false, error: 'Wikipedia article not found' },
        { status: 404 }
      );
    }

    const page = pages[pageIds[0]];
    const metadata = transformWikipediaData(page, language);

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Wikipedia lookup error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lookup Wikipedia article' },
      { status: 500 }
    );
  }
}

/**
 * Parse Wikipedia URL to extract language and title
 */
function parseWikipediaUrl(url: string): { language: string; title: string } | null {
  try {
    const parsed = new URL(url);

    // Check if it's a Wikipedia domain
    const hostMatch = parsed.hostname.match(/^(\w+)\.(?:m\.)?wikipedia\.org$/);
    if (!hostMatch) {
      return null;
    }

    const language = hostMatch[1];

    // Extract title from path
    const pathMatch = parsed.pathname.match(/\/wiki\/(.+)/);
    if (!pathMatch) {
      return null;
    }

    // Decode URL-encoded title and replace underscores
    const title = decodeURIComponent(pathMatch[1]).replace(/_/g, ' ');

    return { language, title };
  } catch {
    return null;
  }
}

/**
 * Transform Wikipedia API response to our format
 */
function transformWikipediaData(
  page: {
    pageid?: number;
    title?: string;
    revisions?: Array<{ timestamp?: string }>;
    extract?: string;
    pageprops?: { wikibase_item?: string; description?: string };
  },
  language: string
): WikipediaMetadataResult {
  const now = new Date();
  const title = page.title || 'Unknown';

  // Get language name for site name
  const languageNames: Record<string, string> = {
    en: 'Wikipedia',
    es: 'Wikipedia en español',
    fr: 'Wikipédia en français',
    de: 'Wikipedia auf Deutsch',
    ja: 'ウィキペディア日本語版',
    zh: '中文维基百科',
    ru: 'Русская Википедия',
    pt: 'Wikipédia em português',
    it: 'Wikipedia in italiano',
  };

  const result: WikipediaMetadataResult = {
    title,
    siteName: languageNames[language] || 'Wikipedia',
    url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    accessDate: {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    },
    language,
    pageId: page.pageid,
  };

  // Extract last modified date
  if (page.revisions && page.revisions[0]?.timestamp) {
    const modified = new Date(page.revisions[0].timestamp);
    if (!isNaN(modified.getTime())) {
      result.lastModified = {
        year: modified.getFullYear(),
        month: modified.getMonth() + 1,
        day: modified.getDate(),
      };
    }
  }

  // Extract description/summary
  if (page.extract) {
    result.description = page.extract.trim();
  } else if (page.pageprops?.description) {
    result.description = page.pageprops.description;
  }

  return result;
}

// Support GET for testing
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const url = request.nextUrl.searchParams.get('url');
  const title = request.nextUrl.searchParams.get('title');

  if (!url && !title) {
    return NextResponse.json(
      { success: false, error: 'URL or title parameter is required' },
      { status: 400 }
    );
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url, title }),
  });

  return POST(mockRequest);
}
