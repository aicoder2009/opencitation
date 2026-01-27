/**
 * ISBN Lookup API
 *
 * Fetches book metadata using:
 * 1. Open Library API (primary, free, no auth needed)
 * 2. Google Books API (fallback, free with quota)
 */

import { NextRequest, NextResponse } from 'next/server';

interface Author {
  firstName?: string;
  middleName?: string;
  lastName: string;
}

interface ISBNMetadataResult {
  isbn: string;
  title?: string;
  subtitle?: string;
  authors?: Author[];
  publisher?: string;
  publicationDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  publicationPlace?: string;
  edition?: string;
  pageCount?: number;
  language?: string;
  subjects?: string[];
  description?: string;
  coverImage?: string;
}

interface APIResponse {
  success: boolean;
  data?: ISBNMetadataResult;
  error?: string;
  source?: 'openlibrary' | 'googlebooks';
}

interface OpenLibraryBook {
  title?: string;
  subtitle?: string;
  authors?: Array<{ name?: string; key?: string }>;
  publishers?: string[];
  publish_date?: string;
  publish_places?: string[];
  number_of_pages?: number;
  subjects?: string[];
  description?: string | { value: string };
  languages?: Array<{ key: string }>;
  covers?: number[];
  edition_name?: string;
}

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    let { isbn } = body;

    if (!isbn) {
      return NextResponse.json(
        { success: false, error: 'ISBN is required' },
        { status: 400 }
      );
    }

    // Clean and validate ISBN
    isbn = cleanISBN(isbn);

    if (!isValidISBN(isbn)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ISBN format' },
        { status: 400 }
      );
    }

    // Try Open Library first (free, no rate limits)
    const openLibraryResult = await fetchFromOpenLibrary(isbn);
    if (openLibraryResult) {
      return NextResponse.json({
        success: true,
        data: openLibraryResult,
        source: 'openlibrary',
      });
    }

    // Fallback to Google Books
    const googleBooksResult = await fetchFromGoogleBooks(isbn);
    if (googleBooksResult) {
      return NextResponse.json({
        success: true,
        data: googleBooksResult,
        source: 'googlebooks',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Book not found in any database' },
      { status: 404 }
    );
  } catch (error) {
    console.error('ISBN lookup error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lookup ISBN' },
      { status: 500 }
    );
  }
}

/**
 * Clean ISBN - remove hyphens and spaces
 */
function cleanISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Validate ISBN format (ISBN-10 or ISBN-13)
 */
function isValidISBN(isbn: string): boolean {
  // ISBN-10: 10 digits (last can be X)
  const isbn10Pattern = /^\d{9}[\dX]$/;
  // ISBN-13: 13 digits starting with 978 or 979
  const isbn13Pattern = /^97[89]\d{10}$/;

  return isbn10Pattern.test(isbn) || isbn13Pattern.test(isbn);
}

/**
 * Fetch book data from Open Library
 */
async function fetchFromOpenLibrary(isbn: string): Promise<ISBNMetadataResult | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenCitation/1.0',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const bookData: OpenLibraryBook = data[`ISBN:${isbn}`];

    if (!bookData) {
      return null;
    }

    const result: ISBNMetadataResult = {
      isbn,
      title: bookData.title,
      subtitle: bookData.subtitle,
    };

    // Parse authors
    if (bookData.authors && bookData.authors.length > 0) {
      result.authors = bookData.authors.map((author) => parseAuthorName(author.name || ''));
    }

    // Publisher
    if (bookData.publishers && bookData.publishers.length > 0) {
      result.publisher = bookData.publishers[0];
    }

    // Publication date
    if (bookData.publish_date) {
      result.publicationDate = parsePublishDate(bookData.publish_date);
    }

    // Publication place
    if (bookData.publish_places && bookData.publish_places.length > 0) {
      result.publicationPlace = bookData.publish_places[0];
    }

    // Edition
    if (bookData.edition_name) {
      result.edition = bookData.edition_name;
    }

    // Page count
    if (bookData.number_of_pages) {
      result.pageCount = bookData.number_of_pages;
    }

    // Subjects
    if (bookData.subjects && bookData.subjects.length > 0) {
      result.subjects = bookData.subjects.slice(0, 10);
    }

    // Description
    if (bookData.description) {
      result.description =
        typeof bookData.description === 'string'
          ? bookData.description
          : bookData.description.value;
    }

    // Cover image
    if (bookData.covers && bookData.covers.length > 0) {
      result.coverImage = `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-M.jpg`;
    }

    // Language
    if (bookData.languages && bookData.languages.length > 0) {
      const langKey = bookData.languages[0].key;
      result.language = langKey.replace('/languages/', '');
    }

    return result;
  } catch (error) {
    console.error('Open Library fetch error:', error);
    return null;
  }
}

/**
 * Fetch book data from Google Books
 */
async function fetchFromGoogleBooks(isbn: string): Promise<ISBNMetadataResult | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const bookData: GoogleBooksVolume = data.items[0];
    const {volumeInfo} = bookData;

    if (!volumeInfo) {
      return null;
    }

    const result: ISBNMetadataResult = {
      isbn,
      title: volumeInfo.title,
      subtitle: volumeInfo.subtitle,
    };

    // Parse authors
    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
      result.authors = volumeInfo.authors.map((name) => parseAuthorName(name));
    }

    // Publisher
    if (volumeInfo.publisher) {
      result.publisher = volumeInfo.publisher;
    }

    // Publication date
    if (volumeInfo.publishedDate) {
      result.publicationDate = parsePublishDate(volumeInfo.publishedDate);
    }

    // Page count
    if (volumeInfo.pageCount) {
      result.pageCount = volumeInfo.pageCount;
    }

    // Subjects/Categories
    if (volumeInfo.categories && volumeInfo.categories.length > 0) {
      result.subjects = volumeInfo.categories;
    }

    // Description
    if (volumeInfo.description) {
      result.description = volumeInfo.description;
    }

    // Cover image
    if (volumeInfo.imageLinks?.thumbnail) {
      // Convert to HTTPS
      result.coverImage = volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
    }

    // Language
    if (volumeInfo.language) {
      result.language = volumeInfo.language;
    }

    return result;
  } catch (error) {
    console.error('Google Books fetch error:', error);
    return null;
  }
}

/**
 * Parse author name into first/middle/last components
 */
function parseAuthorName(fullName: string): Author {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { lastName: parts[0] };
  }

  if (parts.length === 2) {
    return {
      firstName: parts[0],
      lastName: parts[1],
    };
  }

  // 3+ parts: assume last part is last name, first is first name, rest is middle
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Parse publication date string into year/month/day
 */
function parsePublishDate(dateStr: string): ISBNMetadataResult['publicationDate'] {
  // Try YYYY-MM-DD format
  const isoMatch = dateStr.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: isoMatch[2] ? parseInt(isoMatch[2], 10) : undefined,
      day: isoMatch[3] ? parseInt(isoMatch[3], 10) : undefined,
    };
  }

  // Try "Month Day, Year" or "Month Year" format
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };

  const textMatch = dateStr.toLowerCase().match(/(\w+)\s*(\d{1,2})?,?\s*(\d{4})/);
  if (textMatch) {
    const month = months[textMatch[1]];
    return {
      year: parseInt(textMatch[3], 10),
      month,
      day: textMatch[2] ? parseInt(textMatch[2], 10) : undefined,
    };
  }

  // Just year
  const yearMatch = dateStr.match(/(\d{4})/);
  if (yearMatch) {
    return { year: parseInt(yearMatch[1], 10) };
  }

  return undefined;
}

// Also support GET for simple testing
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const isbn = request.nextUrl.searchParams.get('isbn');

  if (!isbn) {
    return NextResponse.json(
      { success: false, error: 'ISBN parameter is required' },
      { status: 400 }
    );
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ isbn }),
  });

  return POST(mockRequest);
}
