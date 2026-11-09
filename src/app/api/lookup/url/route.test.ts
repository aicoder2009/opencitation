import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/security/safe-fetch', async () => {
  const actual = await vi.importActual<typeof import('@/lib/security/safe-fetch')>(
    '@/lib/security/safe-fetch'
  );
  return {
    ...actual,
    safeFetchText: vi.fn(),
  };
});

// The URL route runs the DOI and ISBN routes in-process when it spots an
// identifier in the URL; stub them so these tests stay offline.
vi.mock('../doi/route', () => ({ POST: vi.fn() }));
vi.mock('../isbn/route', () => ({ POST: vi.fn() }));

import { POST } from './route';
import { POST as doiLookup } from '../doi/route';
import { POST as isbnLookup } from '../isbn/route';
import { safeFetchText } from '@/lib/security/safe-fetch';

const mockSafeFetch = safeFetchText as unknown as ReturnType<typeof vi.fn>;
const mockDoiLookup = doiLookup as unknown as ReturnType<typeof vi.fn>;
const mockIsbnLookup = isbnLookup as unknown as ReturnType<typeof vi.fn>;

// Mock fetch globally for the oEmbed / Wayback / arXiv calls the route makes directly.
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const lookup = (url: string) =>
  POST(new NextRequest('http://localhost/api/lookup/url', { method: 'POST', body: JSON.stringify({ url }) }));

const page = (status: number, text = '', finalUrl = 'https://example.com') => ({ ok: status >= 200 && status < 300, status, text, finalUrl });
const jsonResponse = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

const ARTICLE_HTML = `
  <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="Test description">
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Description">
    </head>
    <body>Content</body>
  </html>
`;
const CHALLENGE_HTML = '<html><head><title>Just a moment...</title></head><body>Checking your browser</body></html>';
const NYT_URL = 'https://www.nytimes.com/2020/03/11/health/coronavirus-pandemic-who.html';
const NYT_ARCHIVED_HTML = `
  <html><head>
    <meta property="og:title" content="Coronavirus Has Become a Pandemic, W.H.O. Says">
    <meta property="article:published_time" content="2020-03-11T19:59:48.000Z">
    <meta property="og:site_name" content="The New York Times">
  </head></html>
`;
// The Wayback CDX index (via fetch) and the capture itself (via safeFetchText).
const noCaptures = () => jsonResponse([]);
const captures = (...timestamps: string[]) => jsonResponse([['timestamp'], ...timestamps.map((ts) => [ts])]);
const snapshotAt = (timestamp: string, html: string, url: string) =>
  page(200, html, `https://web.archive.org/web/${timestamp}id_/${url}`);

describe('URL Lookup API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return error when URL is missing', async () => {
    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('URL is required');
  });

  it('should return error for invalid URL format', async () => {
    const response = await lookup('not-a-valid-url');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid URL format');
  });

  it('should block URLs on the dedicated blocklist with formatted error message', async () => {
    const response = await lookup('https://chatgpt.com/share/test-uuid');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe(
      'Sorry, https://chatgpt.com/share/test-uuid is blocked. Reason: Interactive AI chat interface.'
    );
  });

  it('should extract metadata from HTML', async () => {
    mockSafeFetch.mockResolvedValueOnce(page(200, ARTICLE_HTML));

    const response = await lookup('https://example.com');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('direct');
    expect(data.warning).toBeUndefined();
    expect(data.data.title).toBe('OG Title');
    expect(mockSafeFetch).toHaveBeenCalledTimes(1);
  });

  it('should reject SSRF blocks with 400', async () => {
    const { SafeFetchError } = await import('@/lib/security/safe-fetch');
    mockSafeFetch.mockRejectedValueOnce(new SafeFetchError('blocked', 'blocked_address'));

    const response = await lookup('http://169.254.169.254/');
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  describe('pages that cannot be fetched', () => {
    it('loads an Internet Archive snapshot when the site returns 403', async () => {
      mockSafeFetch
        .mockResolvedValueOnce(page(403)) // browser-like fetch
        .mockResolvedValueOnce(page(403)) // self-identified crawler retry
        .mockResolvedValueOnce(snapshotAt('20200311195948', NYT_ARCHIVED_HTML, NYT_URL)); // archived copy
      mockFetch.mockResolvedValueOnce(captures('20200311195948'));

      const response = await lookup(NYT_URL);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.source).toBe('archive');
      expect(data.data.title).toBe('Coronavirus Has Become a Pandemic, W.H.O. Says');
      expect(data.data.publishedDate).toBe('2020-03-11T19:59:48.000Z');
      expect(data.data.url).toBe(NYT_URL);
      expect(data.data.suggestedSourceType).toBe('newspaper');
      expect(data.warning).toContain('Internet Archive');
      expect(data.warning).toContain('2020-03-11');
      expect(mockSafeFetch.mock.calls[2][0]).toBe(`https://web.archive.org/web/20200311195948id_/${NYT_URL}`);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('infers fields from the URL when nothing else works', async () => {
      mockSafeFetch.mockResolvedValueOnce(page(403)).mockResolvedValueOnce(page(403));
      mockFetch.mockResolvedValueOnce(noCaptures());

      const response = await lookup(NYT_URL);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.source).toBe('inferred');
      expect(data.data).toEqual({
        url: NYT_URL,
        title: 'Coronavirus Pandemic Who',
        publishedDate: '2020-03-11',
        siteName: 'The New York Times',
        suggestedSourceType: 'newspaper',
      });
      expect(data.warning).toContain('blocks automated access');
      expect(data.warning).toContain('inferred from the URL');
    });

    it('treats a 200 bot-challenge page as blocked', async () => {
      mockSafeFetch.mockResolvedValueOnce(page(200, CHALLENGE_HTML)).mockResolvedValueOnce(page(200, CHALLENGE_HTML));
      mockFetch.mockResolvedValueOnce(noCaptures());

      const response = await lookup('https://www.wsj.com/articles/some-headline-here-11612345678');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.source).toBe('inferred');
      expect(data.data.title).toBe('Some Headline Here');
      expect(data.data.siteName).toBe('The Wall Street Journal');
      expect(data.warning).toContain('blocks automated access');
    });

    it('uses the crawler retry when the site serves crawlers a real page', async () => {
      mockSafeFetch.mockResolvedValueOnce(page(403)).mockResolvedValueOnce(page(200, ARTICLE_HTML));

      const response = await lookup('https://example.com/some-article');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.source).toBe('crawler');
      expect(data.data.title).toBe('OG Title');
      expect(data.warning).toBeUndefined();
      expect(mockSafeFetch.mock.calls[1][1].headers['User-Agent']).toContain('OpenCitationBot');
    });

    it('uses the platform oEmbed record for sites that serve JavaScript shells', async () => {
      mockSafeFetch.mockResolvedValueOnce(page(200, '<html><head><title>YouTube</title></head></html>'));
      mockFetch.mockResolvedValueOnce(jsonResponse({ title: 'Never Gonna Give You Up', author_name: 'Rick Astley' }));

      const response = await lookup('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.source).toBe('oembed');
      expect(data.warning).toBeUndefined();
      expect(data.data.title).toBe('Never Gonna Give You Up');
      expect(data.data.channelName).toBe('Rick Astley');
      expect(data.data.platform).toBe('YouTube');
      expect(data.data.suggestedSourceType).toBe('video');
      expect(mockSafeFetch).toHaveBeenCalledTimes(1);
    });

    it('falls back when the fetch fails with a network error', async () => {
      mockSafeFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce(noCaptures());

      const response = await lookup('https://example.com');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.source).toBe('inferred');
      expect(data.data).toEqual({ url: 'https://example.com/', siteName: 'example.com' });
      expect(data.warning).toContain('could not be reached');
      expect(data.warning).toContain('add the title, author, and date manually');
    });

    it('skips the crawler retry after a timeout', async () => {
      const abortError = new Error('Timeout');
      abortError.name = 'TimeoutError';
      mockSafeFetch.mockRejectedValueOnce(abortError);
      mockFetch.mockResolvedValueOnce(noCaptures());

      const response = await lookup('https://example.com/a-slow-page');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.source).toBe('inferred');
      expect(data.warning).toContain('could not be reached');
      // No second fetch of the original URL after a timeout.
      expect(mockSafeFetch).toHaveBeenCalledTimes(1);
    });

    it('describes a 500 as the site being unavailable', async () => {
      mockSafeFetch.mockResolvedValueOnce(page(503)).mockResolvedValueOnce(page(503));
      mockFetch.mockResolvedValueOnce(noCaptures());

      const data = await (await lookup('https://example.com/an-article-title')).json();
      expect(data.success).toBe(true);
      expect(data.warning).toContain('currently unavailable');
    });

    it('still reports 404 when no archived copy exists', async () => {
      mockSafeFetch.mockResolvedValueOnce(page(404));
      mockFetch.mockResolvedValueOnce(noCaptures());

      const response = await lookup('https://example.com');
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Page not found');
      // A missing page goes straight to the archive index; no crawler retry.
      expect(mockSafeFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('web.archive.org/cdx/search/cdx');
    });

    it('recovers a deleted page from the archive', async () => {
      mockSafeFetch
        .mockResolvedValueOnce(page(404))
        .mockResolvedValueOnce(snapshotAt('20210105012949', NYT_ARCHIVED_HTML, NYT_URL));
      mockFetch.mockResolvedValueOnce(captures('20210105012949'));

      const data = await (await lookup(NYT_URL)).json();
      expect(data.success).toBe(true);
      expect(data.source).toBe('archive');
      expect(data.warning).toContain('no longer exists');
      expect(data.warning).toContain('2021-01-05');
    });
  });

  describe('identifiers embedded in the URL', () => {
    it('resolves a publisher DOI through CrossRef without fetching the page', async () => {
      mockDoiLookup.mockResolvedValueOnce(
        NextResponse.json({
          success: true,
          data: {
            doi: '10.1002/anie.202001234',
            type: 'journal',
            title: 'A Paper',
            journalTitle: 'Angewandte Chemie',
            authors: [{ firstName: 'Ada', lastName: 'Lovelace' }],
            url: 'https://doi.org/10.1002/anie.202001234',
          },
        })
      );

      const response = await lookup('https://onlinelibrary.wiley.com/doi/10.1002/anie.202001234');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.source).toBe('doi');
      expect(data.data.title).toBe('A Paper');
      expect(data.data.journalTitle).toBe('Angewandte Chemie');
      expect(data.data.suggestedSourceType).toBe('journal');
      expect(data.data.url).toBe('https://onlinelibrary.wiley.com/doi/10.1002/anie.202001234');
      expect(mockSafeFetch).not.toHaveBeenCalled();
      const sent = await (mockDoiLookup.mock.calls[0][0] as NextRequest).json();
      expect(sent).toEqual({ doi: '10.1002/anie.202001234' });
    });

    it('fetches the page when CrossRef does not know the DOI', async () => {
      mockDoiLookup.mockResolvedValueOnce(NextResponse.json({ success: false, error: 'DOI not found' }, { status: 404 }));
      mockSafeFetch.mockResolvedValueOnce(page(200, ARTICLE_HTML));

      const data = await (await lookup('https://example.com/doi/10.9999/unknown')).json();
      expect(data.success).toBe(true);
      expect(data.source).toBe('direct');
      expect(data.data.title).toBe('OG Title');
    });

    it('resolves an Amazon book page through the ISBN lookup', async () => {
      mockIsbnLookup.mockResolvedValueOnce(
        NextResponse.json({
          success: true,
          data: { isbn: '0134685997', title: 'Effective Java', authors: [{ firstName: 'Joshua', lastName: 'Bloch' }] },
        })
      );

      const data = await (await lookup('https://www.amazon.com/Effective-Java-Joshua-Bloch/dp/0134685997/ref=sr_1_1')).json();
      expect(data.success).toBe(true);
      expect(data.source).toBe('isbn');
      expect(data.data.title).toBe('Effective Java');
      expect(data.data.suggestedSourceType).toBe('book');
      expect(mockSafeFetch).not.toHaveBeenCalled();
      const sent = await (mockIsbnLookup.mock.calls[0][0] as NextRequest).json();
      expect(sent).toEqual({ isbn: '0134685997' });
    });
  });
});
