/**
 * PubMed Lookup API
 *
 * Fetches citation metadata from NCBI E-utilities using PMID
 * No API key required (rate limited to 3 requests/second)
 */

import { NextRequest, NextResponse } from 'next/server';

interface PubMedAuthor {
  lastName: string;
  firstName?: string;
  initials?: string;
  collectiveName?: string; // For group/organization authors
}

interface PubMedMetadataResult {
  pmid: string;
  title?: string;
  authors?: Array<{
    firstName?: string;
    lastName: string;
    isOrganization?: boolean;
  }>;
  journalTitle?: string;
  journalAbbrev?: string;
  volume?: string;
  issue?: string;
  pageRange?: string;
  publicationDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  doi?: string;
  url: string;
  abstract?: string;
  keywords?: string[];
  language?: string;
}

interface APIResponse {
  success: boolean;
  data?: PubMedMetadataResult;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    let { pmid } = body;

    if (!pmid) {
      return NextResponse.json(
        { success: false, error: 'PMID is required' },
        { status: 400 }
      );
    }

    // Clean up PMID - extract number only
    pmid = extractPMID(pmid);

    if (!pmid) {
      return NextResponse.json(
        { success: false, error: 'Invalid PMID format. Please enter a numeric PMID.' },
        { status: 400 }
      );
    }

    // Fetch from PubMed E-utilities (XML format for better parsing)
    const pubmedUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;

    const response = await fetch(pubmedUrl, {
      headers: {
        'User-Agent': 'OpenCitation/1.0 (https://opencitation.com)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'PMID not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: `PubMed API error: ${response.status}` },
        { status: 502 }
      );
    }

    const xml = await response.text();

    // Check if PMID was found
    if (xml.includes('<ERROR>')) {
      return NextResponse.json(
        { success: false, error: 'PMID not found in PubMed database' },
        { status: 404 }
      );
    }

    const metadata = parsePubMedXML(xml, pmid);

    if (!metadata.title) {
      return NextResponse.json(
        { success: false, error: 'Could not parse PubMed response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('PubMed lookup error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lookup PMID' },
      { status: 500 }
    );
  }
}

/**
 * Extract PMID from various formats:
 * - 12345678
 * - PMID: 12345678
 * - https://pubmed.ncbi.nlm.nih.gov/12345678/
 */
function extractPMID(input: string): string | null {
  input = input.trim();

  // Extract from URL
  const urlMatch = input.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Remove PMID: prefix
  if (input.toLowerCase().startsWith('pmid:')) {
    input = input.substring(5).trim();
  }
  if (input.toLowerCase().startsWith('pmid')) {
    input = input.substring(4).trim();
  }

  // Validate - PMID is numeric only
  if (/^\d+$/.test(input)) {
    return input;
  }

  return null;
}

/**
 * Parse PubMed XML response
 */
function parsePubMedXML(xml: string, pmid: string): PubMedMetadataResult {
  const result: PubMedMetadataResult = {
    pmid,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
  };

  // Extract title
  const titleMatch = xml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
  if (titleMatch) {
    result.title = decodeXMLEntities(titleMatch[1]);
  }

  // Extract authors
  const authorMatches = xml.matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g);
  const authors: PubMedMetadataResult['authors'] = [];

  for (const match of authorMatches) {
    const authorXml = match[1];

    // Check for collective name (organization)
    const collectiveMatch = authorXml.match(/<CollectiveName>([^<]+)<\/CollectiveName>/);
    if (collectiveMatch) {
      authors.push({
        lastName: decodeXMLEntities(collectiveMatch[1]),
        isOrganization: true,
      });
      continue;
    }

    const lastNameMatch = authorXml.match(/<LastName>([^<]+)<\/LastName>/);
    const foreNameMatch = authorXml.match(/<ForeName>([^<]+)<\/ForeName>/);
    const initialsMatch = authorXml.match(/<Initials>([^<]+)<\/Initials>/);

    if (lastNameMatch) {
      authors.push({
        lastName: decodeXMLEntities(lastNameMatch[1]),
        firstName: foreNameMatch
          ? decodeXMLEntities(foreNameMatch[1])
          : initialsMatch
            ? decodeXMLEntities(initialsMatch[1])
            : undefined,
      });
    }
  }

  if (authors.length > 0) {
    result.authors = authors;
  }

  // Extract journal info
  const journalMatch = xml.match(/<Title>([^<]+)<\/Title>/);
  if (journalMatch) {
    result.journalTitle = decodeXMLEntities(journalMatch[1]);
  }

  const abbrevMatch = xml.match(/<ISOAbbreviation>([^<]+)<\/ISOAbbreviation>/);
  if (abbrevMatch) {
    result.journalAbbrev = decodeXMLEntities(abbrevMatch[1]);
  }

  // Extract volume and issue
  const volumeMatch = xml.match(/<Volume>([^<]+)<\/Volume>/);
  if (volumeMatch) {
    result.volume = volumeMatch[1];
  }

  const issueMatch = xml.match(/<Issue>([^<]+)<\/Issue>/);
  if (issueMatch) {
    result.issue = issueMatch[1];
  }

  // Extract pages
  const pagesMatch = xml.match(/<MedlinePgn>([^<]+)<\/MedlinePgn>/);
  if (pagesMatch) {
    result.pageRange = pagesMatch[1];
  }

  // Extract publication date
  const pubDateMatch = xml.match(/<PubDate>([\s\S]*?)<\/PubDate>/);
  if (pubDateMatch) {
    const dateXml = pubDateMatch[1];
    const yearMatch = dateXml.match(/<Year>(\d{4})<\/Year>/);
    const monthMatch = dateXml.match(/<Month>([^<]+)<\/Month>/);
    const dayMatch = dateXml.match(/<Day>(\d+)<\/Day>/);

    if (yearMatch) {
      result.publicationDate = {
        year: parseInt(yearMatch[1], 10),
      };

      if (monthMatch) {
        const month = parseMonth(monthMatch[1]);
        if (month) {
          result.publicationDate.month = month;
        }
      }

      if (dayMatch) {
        result.publicationDate.day = parseInt(dayMatch[1], 10);
      }
    }
  }

  // Extract DOI
  const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  if (doiMatch) {
    result.doi = doiMatch[1];
  }

  // Extract abstract
  const abstractMatch = xml.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
  if (abstractMatch) {
    result.abstract = decodeXMLEntities(abstractMatch[1]);
  }

  // Extract keywords
  const keywordMatches = xml.matchAll(/<Keyword[^>]*>([^<]+)<\/Keyword>/g);
  const keywords: string[] = [];
  for (const match of keywordMatches) {
    keywords.push(decodeXMLEntities(match[1]));
  }
  if (keywords.length > 0) {
    result.keywords = keywords;
  }

  // Extract language
  const langMatch = xml.match(/<Language>([^<]+)<\/Language>/);
  if (langMatch) {
    result.language = langMatch[1];
  }

  return result;
}

/**
 * Parse month string to number
 */
function parseMonth(month: string): number | undefined {
  const monthNum = parseInt(month, 10);
  if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return monthNum;
  }

  const monthNames: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };

  return monthNames[month.toLowerCase()];
}

/**
 * Decode XML entities
 */
function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Support GET for testing
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const pmid = request.nextUrl.searchParams.get('pmid');

  if (!pmid) {
    return NextResponse.json(
      { success: false, error: 'PMID parameter is required' },
      { status: 400 }
    );
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ pmid }),
  });

  return POST(mockRequest);
}
