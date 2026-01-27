/**
 * DOI Lookup API
 *
 * Fetches citation metadata from CrossRef API using DOI
 * CrossRef is free and doesn't require authentication
 */

import { NextRequest, NextResponse } from 'next/server';

interface Author {
  given?: string;
  family: string;
  name?: string; // For organizations
  sequence?: string;
  affiliation?: Array<{ name: string }>;
}

interface CrossRefResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: {
    DOI: string;
    type: string;
    title?: string[];
    subtitle?: string[];
    author?: Author[];
    editor?: Author[];
    'container-title'?: string[];
    'short-container-title'?: string[];
    publisher?: string;
    published?: {
      'date-parts': number[][];
    };
    'published-print'?: {
      'date-parts': number[][];
    };
    'published-online'?: {
      'date-parts': number[][];
    };
    volume?: string;
    issue?: string;
    page?: string;
    'article-number'?: string;
    URL?: string;
    ISSN?: string[];
    ISBN?: string[];
    abstract?: string;
    subject?: string[];
    language?: string;
    link?: Array<{
      URL: string;
      'content-type': string;
    }>;
  };
}

interface DOIMetadataResult {
  doi: string;
  type: string;
  title?: string;
  subtitle?: string;
  authors?: Array<{
    firstName?: string;
    lastName: string;
    isOrganization?: boolean;
  }>;
  editors?: Array<{
    firstName?: string;
    lastName: string;
  }>;
  journalTitle?: string;
  publisher?: string;
  publicationDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  volume?: string;
  issue?: string;
  pageRange?: string;
  articleNumber?: string;
  url?: string;
  issn?: string;
  isbn?: string;
  abstract?: string;
  subjects?: string[];
  language?: string;
}

interface APIResponse {
  success: boolean;
  data?: DOIMetadataResult;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    let { doi } = body;

    if (!doi) {
      return NextResponse.json(
        { success: false, error: 'DOI is required' },
        { status: 400 }
      );
    }

    // Clean up DOI - extract from URL if needed
    doi = extractDOI(doi);

    if (!doi) {
      return NextResponse.json(
        { success: false, error: 'Invalid DOI format' },
        { status: 400 }
      );
    }

    // Fetch from CrossRef
    const crossRefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;

    const response = await fetch(crossRefUrl, {
      headers: {
        'User-Agent': 'OpenCitation/1.0 (https://opencitation.com; mailto:support@opencitation.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'DOI not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: `CrossRef API error: ${response.status}` },
        { status: 502 }
      );
    }

    const crossRefData: CrossRefResponse = await response.json();
    const metadata = transformCrossRefData(crossRefData.message);

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('DOI lookup error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lookup DOI' },
      { status: 500 }
    );
  }
}

/**
 * Extract DOI from various formats:
 * - 10.1000/xyz123
 * - doi:10.1000/xyz123
 * - https://doi.org/10.1000/xyz123
 * - https://dx.doi.org/10.1000/xyz123
 */
function extractDOI(input: string): string | null {
  // Remove whitespace
  input = input.trim();

  // DOI regex pattern
  const doiPattern = /10\.\d{4,}(?:\.\d+)*\/[^\s]+/;

  // Try to extract DOI from URL
  if (input.startsWith('http')) {
    const match = input.match(doiPattern);
    return match ? match[0] : null;
  }

  // Remove doi: prefix
  if (input.toLowerCase().startsWith('doi:')) {
    input = input.substring(4).trim();
  }

  // Validate DOI format
  if (doiPattern.test(input)) {
    return input;
  }

  return null;
}

/**
 * Transform CrossRef response to our metadata format
 */
function transformCrossRefData(message: CrossRefResponse['message']): DOIMetadataResult {
  const result: DOIMetadataResult = {
    doi: message.DOI,
    type: mapCrossRefType(message.type),
  };

  // Title
  if (message.title && message.title.length > 0) {
    result.title = message.title[0];
  }

  // Subtitle
  if (message.subtitle && message.subtitle.length > 0) {
    result.subtitle = message.subtitle[0];
  }

  // Authors
  if (message.author && message.author.length > 0) {
    result.authors = message.author.map((author) => {
      if (author.name) {
        // Organization author
        return {
          lastName: author.name,
          isOrganization: true,
        };
      }
      return {
        firstName: author.given,
        lastName: author.family,
      };
    });
  }

  // Editors
  if (message.editor && message.editor.length > 0) {
    result.editors = message.editor.map((editor) => ({
      firstName: editor.given,
      lastName: editor.family,
    }));
  }

  // Journal/Container title
  if (message['container-title'] && message['container-title'].length > 0) {
    result.journalTitle = message['container-title'][0];
  }

  // Publisher
  if (message.publisher) {
    result.publisher = message.publisher;
  }

  // Publication date
  const dateInfo =
    message.published ||
    message['published-print'] ||
    message['published-online'];

  if (dateInfo && dateInfo['date-parts'] && dateInfo['date-parts'][0]) {
    const [year, month, day] = dateInfo['date-parts'][0];
    result.publicationDate = {
      year,
      month,
      day,
    };
  }

  // Volume and issue
  if (message.volume) {
    result.volume = message.volume;
  }
  if (message.issue) {
    result.issue = message.issue;
  }

  // Pages
  if (message.page) {
    result.pageRange = message.page;
  } else if (message['article-number']) {
    result.articleNumber = message['article-number'];
  }

  // URL
  if (message.URL) {
    result.url = message.URL;
  }

  // ISSN
  if (message.ISSN && message.ISSN.length > 0) {
    result.issn = message.ISSN[0];
  }

  // ISBN
  if (message.ISBN && message.ISBN.length > 0) {
    result.isbn = message.ISBN[0];
  }

  // Abstract
  if (message.abstract) {
    // Remove HTML tags from abstract
    result.abstract = message.abstract.replace(/<[^>]*>/g, '');
  }

  // Subjects
  if (message.subject && message.subject.length > 0) {
    result.subjects = message.subject;
  }

  // Language
  if (message.language) {
    result.language = message.language;
  }

  return result;
}

/**
 * Map CrossRef types to our source types
 */
function mapCrossRefType(crossRefType: string): string {
  const typeMap: Record<string, string> = {
    'journal-article': 'journal',
    'book': 'book',
    'book-chapter': 'book',
    'monograph': 'book',
    'edited-book': 'book',
    'reference-book': 'book',
    'proceedings-article': 'journal',
    'posted-content': 'website', // preprints
    'dissertation': 'miscellaneous',
    'report': 'miscellaneous',
    'dataset': 'miscellaneous',
    'component': 'miscellaneous',
  };

  return typeMap[crossRefType] || 'miscellaneous';
}

// Also support GET for simple testing
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const doi = request.nextUrl.searchParams.get('doi');

  if (!doi) {
    return NextResponse.json(
      { success: false, error: 'DOI parameter is required' },
      { status: 400 }
    );
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ doi }),
  });

  return POST(mockRequest);
}
