/**
 * arXiv Lookup API
 *
 * Fetches citation metadata from arXiv API using arXiv ID
 * No API key required (returns Atom XML)
 */

import { NextRequest, NextResponse } from 'next/server';

interface ArxivMetadataResult {
  arxivId: string;
  title?: string;
  authors?: Array<{
    firstName?: string;
    lastName: string;
  }>;
  journalTitle: string; // Always "arXiv"
  publicationDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  updatedDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  doi?: string;
  url: string;
  pdfUrl: string;
  abstract?: string;
  categories?: string[];
  primaryCategory?: string;
  comment?: string;
  journalRef?: string; // If published in a journal
}

interface APIResponse {
  success: boolean;
  data?: ArxivMetadataResult;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    let { arxivId } = body;

    if (!arxivId) {
      return NextResponse.json(
        { success: false, error: 'arXiv ID is required' },
        { status: 400 }
      );
    }

    // Clean up arXiv ID
    arxivId = extractArxivId(arxivId);

    if (!arxivId) {
      return NextResponse.json(
        { success: false, error: 'Invalid arXiv ID format. Expected format: 2301.00001 or hep-th/9901001' },
        { status: 400 }
      );
    }

    // Fetch from arXiv API
    const arxivUrl = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`;

    const response = await fetch(arxivUrl, {
      headers: {
        'User-Agent': 'OpenCitation/1.0 (https://opencitation.com)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `arXiv API error: ${response.status}` },
        { status: 502 }
      );
    }

    const xml = await response.text();

    // Check if entry was found
    if (!xml.includes('<entry>')) {
      return NextResponse.json(
        { success: false, error: 'arXiv ID not found' },
        { status: 404 }
      );
    }

    const metadata = parseArxivXML(xml, arxivId);

    if (!metadata.title) {
      return NextResponse.json(
        { success: false, error: 'Could not parse arXiv response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('arXiv lookup error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lookup arXiv ID' },
      { status: 500 }
    );
  }
}

/**
 * Extract arXiv ID from various formats:
 * - 2301.00001
 * - arXiv:2301.00001
 * - hep-th/9901001
 * - https://arxiv.org/abs/2301.00001
 * - https://arxiv.org/pdf/2301.00001.pdf
 */
function extractArxivId(input: string): string | null {
  input = input.trim();

  // Extract from URL
  const urlMatch = input.match(/arxiv\.org\/(?:abs|pdf)\/([^\s\/?]+)/i);
  if (urlMatch) {
    return urlMatch[1].replace('.pdf', '');
  }

  // Remove arXiv: prefix
  if (input.toLowerCase().startsWith('arxiv:')) {
    input = input.substring(6).trim();
  }

  // New format: YYMM.NNNNN (e.g., 2301.00001)
  const newFormatMatch = input.match(/^(\d{4}\.\d{4,5})(v\d+)?$/);
  if (newFormatMatch) {
    return newFormatMatch[1];
  }

  // Old format: subject-class/YYMMNNN (e.g., hep-th/9901001)
  const oldFormatMatch = input.match(/^([a-z-]+\/\d{7})(v\d+)?$/i);
  if (oldFormatMatch) {
    return oldFormatMatch[1];
  }

  return null;
}

/**
 * Parse arXiv Atom XML response
 */
function parseArxivXML(xml: string, arxivId: string): ArxivMetadataResult {
  const result: ArxivMetadataResult = {
    arxivId,
    journalTitle: 'arXiv',
    url: `https://arxiv.org/abs/${arxivId}`,
    pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
  };

  // Extract entry content (just the first entry)
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) {
    return result;
  }
  const entry = entryMatch[1];

  // Extract title
  const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    // Clean up title (remove newlines and extra spaces)
    result.title = titleMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Extract authors
  const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
  const authors: ArxivMetadataResult['authors'] = [];

  for (const match of authorMatches) {
    const fullName = match[1].trim();
    const nameParts = fullName.split(' ');

    if (nameParts.length === 1) {
      authors.push({ lastName: nameParts[0] });
    } else {
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.join(' ');
      authors.push({ firstName, lastName });
    }
  }

  if (authors.length > 0) {
    result.authors = authors;
  }

  // Extract published date
  const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
  if (publishedMatch) {
    const date = new Date(publishedMatch[1]);
    if (!isNaN(date.getTime())) {
      result.publicationDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }
  }

  // Extract updated date
  const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
  if (updatedMatch) {
    const date = new Date(updatedMatch[1]);
    if (!isNaN(date.getTime())) {
      result.updatedDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }
  }

  // Extract abstract (summary)
  const summaryMatch = entry.match(/<summary>([^<]+)<\/summary>/);
  if (summaryMatch) {
    result.abstract = summaryMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Extract DOI if available
  const doiMatch = entry.match(/<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/);
  if (doiMatch) {
    result.doi = doiMatch[1];
  }

  // Extract categories
  const categoryMatches = entry.matchAll(/<category[^>]*term="([^"]+)"/g);
  const categories: string[] = [];
  let isFirst = true;

  for (const match of categoryMatches) {
    categories.push(match[1]);
    if (isFirst) {
      result.primaryCategory = match[1];
      isFirst = false;
    }
  }

  if (categories.length > 0) {
    result.categories = categories;
  }

  // Extract comment (often contains page count, figures, etc.)
  const commentMatch = entry.match(/<arxiv:comment[^>]*>([^<]+)<\/arxiv:comment>/);
  if (commentMatch) {
    result.comment = commentMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Extract journal reference if published
  const journalRefMatch = entry.match(/<arxiv:journal_ref[^>]*>([^<]+)<\/arxiv:journal_ref>/);
  if (journalRefMatch) {
    result.journalRef = journalRefMatch[1].replace(/\s+/g, ' ').trim();
  }

  return result;
}

// Support GET for testing
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const arxivId = request.nextUrl.searchParams.get('id') ||
                  request.nextUrl.searchParams.get('arxivId');

  if (!arxivId) {
    return NextResponse.json(
      { success: false, error: 'arXiv ID parameter is required (use ?id=...)' },
      { status: 400 }
    );
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ arxivId }),
  });

  return POST(mockRequest);
}
