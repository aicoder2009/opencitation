import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/security/safe-fetch', async () => {
  const actual = await vi.importActual<typeof import('@/lib/security/safe-fetch')>(
    '@/lib/security/safe-fetch'
  );
  return { ...actual, safeFetchText: vi.fn() };
});

import { safeFetchText } from '@/lib/security/safe-fetch';
import {
  dateFromPath,
  extractDoiFromUrl,
  extractIsbnFromUrl,
  fetchOEmbedMetadata,
  fetchWaybackSnapshot,
  findOEmbedProvider,
  formatWaybackDate,
  inferFromUrl,
  isChallengePage,
  siteNameFromHost,
  titleFromPath,
} from './fallbacks';

const mockSafeFetch = safeFetchText as unknown as ReturnType<typeof vi.fn>;
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const jsonResponse = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('extractDoiFromUrl', () => {
  const cases: Array<[string, string | null]> = [
    ['https://onlinelibrary.wiley.com/doi/10.1002/anie.202001234', '10.1002/anie.202001234'],
    ['https://www.tandfonline.com/doi/full/10.1080/01621459.2020.1762617', '10.1080/01621459.2020.1762617'],
    ['https://onlinelibrary.wiley.com/doi/10.1002/anie.202001234/abstract', '10.1002/anie.202001234'],
    ['https://link.springer.com/article/10.1007/s00125-020-05123-4/fulltext.html', '10.1007/s00125-020-05123-4'],
    ['https://pubs.acs.org/doi/pdf/10.1021/acs.jpclett.0c01234', '10.1021/acs.jpclett.0c01234'],
    ['https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0123456', '10.1371/journal.pone.0123456'],
    ['https://www.nature.com/articles/s41586-020-2649-2', '10.1038/s41586-020-2649-2'],
    ['https://www.nature.com/articles/s41586-020-2649-2.pdf', '10.1038/s41586-020-2649-2'],
    ['https://doi.org/10.1000/xyz123', '10.1000/xyz123'],
    ['https://dl.acm.org/doi/10.1145%2F3313831.3376234', '10.1145/3313831.3376234'],
    ['https://www.sciencedirect.com/science/article/pii/S0140673620301835', null],
    ['https://example.com/10.5/not-a-doi', null],
    ['https://example.com/blog/post', null],
  ];

  it.each(cases)('%s → %s', (url, expected) => {
    expect(extractDoiFromUrl(new URL(url))).toBe(expected);
  });
});

describe('extractIsbnFromUrl', () => {
  const cases: Array<[string, string | null]> = [
    ['https://www.amazon.com/dp/0262046307', '0262046307'],
    ['https://www.amazon.com/Effective-Java-Joshua-Bloch/dp/0134685997/ref=sr_1_1?keywords=java', '0134685997'],
    ['https://www.amazon.co.uk/gp/product/0141439513', '0141439513'],
    ['https://www.amazon.de/dp/354088164x', '354088164X'],
    ['https://www.amazon.com/dp/B08N5WRWNW', null],
    ['https://openlibrary.org/isbn/9780140328721', '9780140328721'],
    ['https://www.worldcat.org/isbn/0140328726', '0140328726'],
    ['https://example.com/dp/0262046307', null],
  ];

  it.each(cases)('%s → %s', (url, expected) => {
    expect(extractIsbnFromUrl(new URL(url))).toBe(expected);
  });
});

describe('isChallengePage', () => {
  it('flags bot walls, login shells and empty titles', () => {
    expect(isChallengePage(undefined, 'example.com')).toBe(true);
    expect(isChallengePage('   ', 'example.com')).toBe(true);
    expect(isChallengePage('Just a moment...', 'www.wsj.com')).toBe(true);
    expect(isChallengePage('Attention Required! | Cloudflare', 'example.com')).toBe(true);
    expect(isChallengePage('Access Denied', 'www.nytimes.com')).toBe(true);
    expect(isChallengePage('Robot Check', 'www.amazon.com')).toBe(true);
    expect(isChallengePage('Log in to Facebook', 'www.facebook.com')).toBe(true);
    expect(isChallengePage('Sign in - Google Accounts', 'accounts.google.com')).toBe(true);
    expect(isChallengePage('Login • Instagram', 'www.instagram.com')).toBe(true);
    expect(isChallengePage('403 Forbidden', 'example.com')).toBe(true);
    expect(isChallengePage('Forbidden', 'example.com')).toBe(true);
    expect(isChallengePage('Access Denied | Example', 'example.com')).toBe(true);
    expect(isChallengePage('JavaScript is not available.', 'x.com')).toBe(true);
    expect(isChallengePage('X', 'twitter.com')).toBe(true);
  });

  it('flags a title that is only the site name', () => {
    expect(isChallengePage('Instagram', 'www.instagram.com')).toBe(true);
    expect(isChallengePage('YouTube', 'm.youtube.com')).toBe(true);
    expect(isChallengePage('LinkedIn', 'www.linkedin.com')).toBe(true);
  });

  it('accepts real article titles, including ones that mention walls and logins', () => {
    expect(isChallengePage('Coronavirus Has Become a Pandemic, W.H.O. Says', 'www.nytimes.com')).toBe(false);
    expect(isChallengePage('Why Rust is fast | Example Blog', 'blog.example.com')).toBe(false);
    expect(isChallengePage('How to log in securely', 'example.com')).toBe(false);
    expect(isChallengePage('The Forbidden City', 'www.britannica.com')).toBe(false);
    expect(isChallengePage('How CAPTCHAs Work', 'computer.howstuffworks.com')).toBe(false);
    expect(isChallengePage('Login Security Best Practices', 'auth0.com')).toBe(false);
    expect(isChallengePage('Are You a Robot? The Turing Test at 75', 'example.com')).toBe(false);
    expect(isChallengePage('Access Denied: Stories of Exclusion', 'example.com')).toBe(false);
    expect(isChallengePage('Unusual Traffic Patterns in Urban Planning', 'example.com')).toBe(false);
  });
});

describe('titleFromPath', () => {
  const cases: Array<[string, string | undefined]> = [
    ['/2020/03/11/health/coronavirus-pandemic-who.html', 'Coronavirus Pandemic Who'],
    ['/@someone/why-rust-is-fast-3f2a9c1b2d4e', 'Why Rust Is Fast'],
    ['/articles/some-headline-here-11612345678', 'Some Headline Here'],
    ['/r/programming/comments/1g0v6xq/pandirna_no_one_left_behind/', 'Pandirna No One Left Behind'],
    ['/posts/2023-07-04-hello-world', 'Hello World'],
    ['/the-rise-of-the-machines', 'The Rise of the Machines'],
    ['/news/covid19-cases-rise', 'Covid19 Cases Rise'],
    ['/watch', undefined],
    ['/news/articles/c4gz1234', undefined],
    ['/', undefined],
  ];

  it.each(cases)('%s → %s', (path, expected) => {
    expect(titleFromPath(path)).toBe(expected);
  });
});

describe('dateFromPath', () => {
  it('reads /YYYY/MM/DD/ and /YYYY/MM/ segments', () => {
    expect(dateFromPath('/2020/03/11/health/story.html')).toBe('2020-03-11');
    expect(dateFromPath('/blog/2021/7/some-post')).toBe('2021-07');
  });

  it('reads YYYY-MM-DD inside a slug', () => {
    expect(dateFromPath('/posts/2023-07-04-hello-world')).toBe('2023-07-04');
  });

  it('ignores implausible dates', () => {
    expect(dateFromPath('/1066/12/25/battle')).toBeUndefined();
    expect(dateFromPath('/2020/13/01/x')).toBeUndefined();
    expect(dateFromPath('/products/12345/67')).toBeUndefined();
  });
});

describe('siteNameFromHost', () => {
  it('maps known hosts and strips mobile/www prefixes', () => {
    expect(siteNameFromHost('www.nytimes.com')).toBe('The New York Times');
    expect(siteNameFromHost('edition.cnn.com')).toBe('CNN');
    expect(siteNameFromHost('m.facebook.com')).toBe('Facebook');
    expect(siteNameFromHost('onlinelibrary.wiley.com')).toBe('Wiley Online Library');
  });

  it('falls back to the bare domain', () => {
    expect(siteNameFromHost('www.example.com')).toBe('example.com');
    expect(siteNameFromHost('blog.example.com')).toBe('blog.example.com');
  });
});

describe('inferFromUrl', () => {
  it('derives title, date and site name from the URL', () => {
    expect(
      inferFromUrl(new URL('https://www.nytimes.com/2020/03/11/health/coronavirus-pandemic-who.html'))
    ).toEqual({
      siteName: 'The New York Times',
      title: 'Coronavirus Pandemic Who',
      publishedDate: '2020-03-11',
    });
  });

  it('returns only the site name when the path says nothing', () => {
    expect(inferFromUrl(new URL('https://example.com/'))).toEqual({ siteName: 'example.com' });
  });
});

describe('findOEmbedProvider', () => {
  it('matches known hosts including short domains and subdomains', () => {
    expect(findOEmbedProvider(new URL('https://www.youtube.com/watch?v=x'))?.platform).toBe('YouTube');
    expect(findOEmbedProvider(new URL('https://youtu.be/x'))?.platform).toBe('YouTube');
    expect(findOEmbedProvider(new URL('https://x.com/jack/status/20'))?.platform).toBe('X (Twitter)');
    expect(findOEmbedProvider(new URL('https://mobile.twitter.com/jack/status/20'))?.platform).toBe('X (Twitter)');
    expect(findOEmbedProvider(new URL('https://old.reddit.com/r/x/comments/1/'))?.platform).toBe('Reddit');
    expect(findOEmbedProvider(new URL('https://example.com/'))).toBeNull();
  });
});

describe('fetchOEmbedMetadata', () => {
  it('returns null without fetching for unknown hosts', async () => {
    expect(await fetchOEmbedMetadata(new URL('https://example.com/page'), 5000)).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('maps a YouTube record to title and channel', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ title: 'Never Gonna Give You Up', author_name: 'Rick Astley', provider_name: 'YouTube' })
    );
    const result = await fetchOEmbedMetadata(new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 5000);
    expect(result).toEqual({ platform: 'YouTube', title: 'Never Gonna Give You Up', channelName: 'Rick Astley' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe(
      'https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ'
    );
  });

  it('derives a post title, handle and date from an X embed', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        author_name: 'jack',
        author_url: 'https://x.com/jack',
        html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">just setting up my twttr</p>&mdash; jack (@jack) <a href="https://x.com/jack/status/20">March 21, 2006</a></blockquote>',
      })
    );
    const result = await fetchOEmbedMetadata(new URL('https://twitter.com/jack/status/20'), 5000);
    expect(result).toEqual({
      platform: 'X (Twitter)',
      title: 'just setting up my twttr',
      author: 'jack',
      handle: '@jack',
      publishedDate: '2006-03-21',
    });
  });

  it('splits Bluesky "Name (@handle)" authors and prefixes Reddit users', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ author_name: 'Bluesky (@bsky.app)', html: '<blockquote><p lang="en">Hello &amp; welcome</p></blockquote>' })
    );
    expect(await fetchOEmbedMetadata(new URL('https://bsky.app/profile/bsky.app/post/abc'), 5000)).toEqual({
      platform: 'Bluesky',
      title: 'Hello & welcome',
      author: 'Bluesky',
      handle: '@bsky.app',
    });

    mockFetch.mockResolvedValueOnce(jsonResponse({ title: 'Pandirna - No one left behind', author_name: 'RiouMcDohl26' }));
    expect(await fetchOEmbedMetadata(new URL('https://www.reddit.com/r/BaldursGate3/comments/1g0v6xq/x/'), 5000)).toEqual({
      platform: 'Reddit',
      title: 'Pandirna - No one left behind',
      author: 'RiouMcDohl26',
      handle: 'u/RiouMcDohl26',
    });
  });

  it('returns null on HTTP errors, missing titles and thrown errors', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, false));
    expect(await fetchOEmbedMetadata(new URL('https://vimeo.com/1'), 5000)).toBeNull();

    mockFetch.mockResolvedValueOnce(jsonResponse({ author_name: 'Someone' }));
    expect(await fetchOEmbedMetadata(new URL('https://vimeo.com/1'), 5000)).toBeNull();

    mockFetch.mockRejectedValueOnce(new Error('boom'));
    expect(await fetchOEmbedMetadata(new URL('https://vimeo.com/1'), 5000)).toBeNull();
  });
});

describe('fetchWaybackSnapshot', () => {
  const url = 'https://www.nytimes.com/2020/03/11/health/coronavirus-pandemic-who.html';
  const snapshotUrl = (ts: string) => `https://web.archive.org/web/${ts}id_/${url}`;
  const captures = (...timestamps: string[]) => jsonResponse([['timestamp'], ...timestamps.map((ts) => [ts])]);
  const archived = (ts: string, html = '<html><title>Archived</title></html>') => ({ ok: true, status: 200, text: html, finalUrl: snapshotUrl(ts) });

  it('fetches the newest successful capture listed by the CDX index', async () => {
    mockFetch.mockResolvedValueOnce(captures('20190101000000', '20200311195948'));
    mockSafeFetch.mockResolvedValueOnce(archived('20200311195948'));

    const result = await fetchWaybackSnapshot(url, 10_000);
    expect(result).toEqual({ html: '<html><title>Archived</title></html>', timestamp: '20200311195948', snapshotUrl: snapshotUrl('20200311195948') });
    expect(mockFetch.mock.calls[0][0]).toContain('web.archive.org/cdx/search/cdx?url=');
    expect(mockFetch.mock.calls[0][0]).toContain('filter=statuscode:200');
    expect(mockSafeFetch.mock.calls[0][0]).toBe(snapshotUrl('20200311195948'));
  });

  it('skips captures the caller rejects and falls back to older ones', async () => {
    mockFetch.mockResolvedValueOnce(captures('20190101000000', '20200311195948'));
    mockSafeFetch
      .mockResolvedValueOnce(archived('20200311195948', '<html><title>Just a moment...</title></html>'))
      .mockResolvedValueOnce(archived('20190101000000', '<html><title>Real page</title></html>'));

    const result = await fetchWaybackSnapshot(url, 10_000, (html) => !html.includes('Just a moment'));
    expect(result?.timestamp).toBe('20190101000000');
    expect(mockSafeFetch).toHaveBeenCalledTimes(2);
  });

  it('gives up without fetching when the page was never captured', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    expect(await fetchWaybackSnapshot(url, 10_000)).toBeNull();
    expect(mockSafeFetch).not.toHaveBeenCalled();
  });

  it('tries the capture closest to now when the index is unavailable', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, false));
    mockSafeFetch.mockResolvedValueOnce(archived('20210105012949'));

    const result = await fetchWaybackSnapshot(url, 10_000);
    expect(result?.timestamp).toBe('20210105012949');
    expect(mockSafeFetch.mock.calls[0][0]).toMatch(/^https:\/\/web\.archive\.org\/web\/\d{14}id_\/https:\/\/www\.nytimes\.com/);
  });

  it('returns null for non-200 captures, errors and when out of time', async () => {
    mockFetch.mockResolvedValueOnce(captures('20200311195948'));
    mockSafeFetch.mockResolvedValueOnce({ ok: false, status: 404, text: '', finalUrl: snapshotUrl('20200311195948') });
    expect(await fetchWaybackSnapshot(url, 10_000)).toBeNull();

    mockFetch.mockResolvedValueOnce(captures('20200311195948'));
    mockSafeFetch.mockRejectedValueOnce(new Error('offline'));
    expect(await fetchWaybackSnapshot(url, 10_000)).toBeNull();

    expect(await fetchWaybackSnapshot(url, 500)).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('formatWaybackDate', () => {
  it('formats a 14-digit timestamp as YYYY-MM-DD', () => {
    expect(formatWaybackDate('20200311195948')).toBe('2020-03-11');
  });
});
