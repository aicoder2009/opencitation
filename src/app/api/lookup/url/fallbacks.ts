/**
 * Fallbacks for pages that refuse automated access.
 *
 * Many sites answer a server-side fetch with 401/403, a bot-challenge page,
 * or a JavaScript shell with no metadata. Rather than dead-ending on
 * "use Manual Entry", the URL lookup tries, in order of data quality:
 *
 *   1. Identifiers embedded in the URL itself (DOI, ISBN) → structured APIs
 *   2. oEmbed endpoints published by the platform (YouTube, X, Reddit, ...)
 *   3. A self-identified crawler retry (some sites pre-render for crawlers)
 *   4. The Internet Archive's most recent snapshot of the page
 *   5. Fields inferred from the URL alone (slug → title, path → date)
 *
 * Everything here is best-effort: every network helper resolves to null on
 * any failure so a flaky tier can never turn into a 500 for the user.
 */

import { safeFetchText } from '@/lib/security/safe-fetch';

export const CRAWLER_USER_AGENT =
  'OpenCitationBot/1.0 (+https://opencitation.com; citation metadata lookup)';

/** Metadata a fallback tier can recover. Structurally a subset of the route's MetadataResult. */
export interface FallbackMetadata {
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  publishedDate?: string;
  channelName?: string;
  handle?: string;
  platform?: string;
}

export type BlockReason = 'blocked' | 'unreachable' | 'unavailable' | 'gone';

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^(?:www|m|amp|mobile)\./, '');
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// 1. Identifiers in the URL
// ---------------------------------------------------------------------------

const DOI_PATTERN = /10\.\d{4,9}\/\S+/i;
// Publisher URL segments that follow a DOI but are not part of it.
const DOI_ROUTE_SUFFIX =
  /\/(?:abs|abstract|full|fulltext|pdf|epdf|epub|html|meta|references|figures|citedby|supplemental|summary)$/i;

/**
 * Pull a DOI out of a publisher URL path or query string, e.g.
 *   onlinelibrary.wiley.com/doi/10.1002/anie.202001234
 *   tandfonline.com/doi/full/10.1080/01621459.2020.1762617
 *   journals.plos.org/plosone/article?id=10.1371/journal.pone.0123456
 *   nature.com/articles/s41586-020-2649-2  (Nature prefixes its article ids)
 */
export function extractDoiFromUrl(parsed: URL): string | null {
  const host = normalizeHost(parsed.hostname);

  if (host === 'nature.com' || host.endsWith('.nature.com')) {
    const m = parsed.pathname.match(/\/articles\/([a-z0-9.-]+?)(?:\.pdf)?\/?$/i);
    if (m) return `10.1038/${m[1]}`;
  }

  const candidates = [safeDecode(parsed.pathname), ...parsed.searchParams.values()];
  for (const candidate of candidates) {
    const m = candidate.match(DOI_PATTERN);
    if (!m) continue;
    let doi = m[0];
    let previous: string;
    do {
      previous = doi;
      doi = doi.replace(/\.(?:pdf|html?)$/i, '').replace(DOI_ROUTE_SUFFIX, '');
    } while (doi !== previous);
    doi = doi.replace(/[.,;:]+$/, '');
    if (/^10\.\d{4,9}\/\S+$/.test(doi)) return doi;
  }
  return null;
}

/**
 * Find an ISBN in a bookseller/catalog URL. Amazon's ASIN for books is the
 * ISBN-10 (non-book ASINs start with "B"), and catalogs like Open Library and
 * WorldCat expose /isbn/<isbn> paths.
 */
export function extractIsbnFromUrl(parsed: URL): string | null {
  const host = normalizeHost(parsed.hostname);
  const path = parsed.pathname;

  if (/(?:^|\.)amazon\.[a-z.]{2,6}$/.test(host) || /(?:^|\.)amzn\.[a-z.]{2,6}$/.test(host)) {
    const m = path.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|product)\/(\d{9}[\dX])(?:[/?]|$)/i);
    if (m) return m[1].toUpperCase();
  }

  const m = path.match(/\/isbn\/(97[89]\d{10}|\d{9}[\dX])(?:[/?.]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

// ---------------------------------------------------------------------------
// Challenge / shell detection
// ---------------------------------------------------------------------------

// Anchored to how bot walls actually title themselves, so that articles such
// as "The Forbidden City" or "How CAPTCHAs Work" are not mistaken for one.
const CHALLENGE_TITLES: RegExp[] = [
  /^just a moment/i, // Cloudflare
  /^attention required/i, // Cloudflare
  /^access denied(?:\s*\||$)/i, // Akamai
  /^access to this page has been denied/i, // PerimeterX
  /^robot check$/i, // Amazon
  /^are you a (?:robot|human)\??$/i,
  /^(?:please )?verify (?:that )?you are (?:a )?human/i,
  /^human verification/i,
  /^bot verification/i,
  /^security check(?: required)?$/i,
  /^captcha(?: challenge| verification| required)?$/i,
  /^(?:401|403|429|503)\b/, // "403 Forbidden", "429 Too Many Requests"
  /^(?:error:? )?forbidden$/i,
  /^(?:log ?in|sign ?in|sign ?up)(?: to\b|\s*[-|•–—]|$)/i, // "Log in to Facebook", "Sign in - Google Accounts"
  /^pardon our interruption/i, // Distil
  /^please wait/i, // Incapsula
  /^one moment/i,
  /^redirecting/i,
  /^javascript is (?:not available|disabled|required)/i, // X without JS
  /^x$/i,
];

/**
 * True when a 200 response is really a bot wall, login wall or empty
 * JavaScript shell rather than the page the user asked for.
 */
export function isChallengePage(title: string | undefined, hostname: string): boolean {
  if (!title || !title.trim()) return true;
  const trimmed = title.trim();
  if (CHALLENGE_TITLES.some((re) => re.test(trimmed))) return true;

  // A title that is nothing but the site's own name ("Instagram", "Facebook")
  // is the logged-out shell, not the content.
  const normalizedTitle = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  const labels = normalizeHost(hostname).split('.');
  const siteLabel = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  return normalizedTitle.length > 0 && normalizedTitle === siteLabel;
}

// ---------------------------------------------------------------------------
// 2. oEmbed providers
// ---------------------------------------------------------------------------

interface OEmbedProvider {
  hosts: string[];
  endpoint: string;
  platform: string;
  kind: 'video' | 'social' | 'music' | 'image';
}

// Endpoints verified against each provider's live oEmbed service.
const OEMBED_PROVIDERS: OEmbedProvider[] = [
  { hosts: ['youtube.com', 'youtu.be', 'music.youtube.com'], endpoint: 'https://www.youtube.com/oembed?format=json', platform: 'YouTube', kind: 'video' },
  { hosts: ['vimeo.com', 'player.vimeo.com'], endpoint: 'https://vimeo.com/api/oembed.json', platform: 'Vimeo', kind: 'video' },
  { hosts: ['dailymotion.com', 'dai.ly'], endpoint: 'https://www.dailymotion.com/services/oembed', platform: 'Dailymotion', kind: 'video' },
  { hosts: ['tiktok.com', 'vm.tiktok.com'], endpoint: 'https://www.tiktok.com/oembed', platform: 'TikTok', kind: 'video' },
  { hosts: ['twitter.com', 'x.com'], endpoint: 'https://publish.x.com/oembed?omit_script=true', platform: 'X (Twitter)', kind: 'social' },
  { hosts: ['bsky.app'], endpoint: 'https://embed.bsky.app/oembed', platform: 'Bluesky', kind: 'social' },
  { hosts: ['mastodon.social'], endpoint: 'https://mastodon.social/api/oembed', platform: 'Mastodon', kind: 'social' },
  { hosts: ['reddit.com', 'old.reddit.com'], endpoint: 'https://www.reddit.com/oembed', platform: 'Reddit', kind: 'social' },
  { hosts: ['open.spotify.com'], endpoint: 'https://open.spotify.com/oembed', platform: 'Spotify', kind: 'music' },
  { hosts: ['soundcloud.com', 'on.soundcloud.com'], endpoint: 'https://soundcloud.com/oembed?format=json', platform: 'SoundCloud', kind: 'music' },
  { hosts: ['flickr.com', 'flic.kr'], endpoint: 'https://www.flickr.com/services/oembed?format=json', platform: 'Flickr', kind: 'image' },
];

export function findOEmbedProvider(parsed: URL): OEmbedProvider | null {
  const host = normalizeHost(parsed.hostname);
  return (
    OEMBED_PROVIDERS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null
  );
}

function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    mdash: '—', ndash: '–', hellip: '…',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return named[entity.toLowerCase()] ?? whole;
  });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** The post text from an embed blockquote (X, Bluesky, Mastodon). */
function postTextFromEmbedHtml(html: string): string | undefined {
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const text = stripTags(paragraph ? paragraph[1] : html);
  if (!text) return undefined;
  return text.length > 280 ? `${text.slice(0, 277).trimEnd()}...` : text;
}

/** X embeds end with "— name (@handle) <a>March 21, 2006</a>". */
function dateFromEmbedHtml(html: string): string | undefined {
  const m = html.match(/<a[^>]*>([A-Z][a-z]+ \d{1,2}, \d{4})<\/a>/);
  if (!m) return undefined;
  const date = new Date(m[1]);
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function handleFromAuthorUrl(authorUrl: string | undefined): string | undefined {
  if (!authorUrl) return undefined;
  const m = authorUrl.match(/\/(?:profile\/|@)?([^/?#]+)\/?$/);
  return m ? `@${m[1].replace(/^@/, '')}` : undefined;
}

function socialHandle(
  provider: OEmbedProvider,
  authorName: string,
  inlineHandle: string | undefined,
  uniqueId: string | undefined,
  authorUrl: string | undefined
): string | undefined {
  if (inlineHandle) return `@${inlineHandle}`;
  if (uniqueId) return `@${uniqueId}`;
  if (provider.platform === 'Reddit') return `u/${authorName}`;
  return handleFromAuthorUrl(authorUrl);
}

/**
 * Fetch a platform's oEmbed record for the URL and map it into citation
 * fields. Returns null for hosts without a known provider or on any failure.
 */
export async function fetchOEmbedMetadata(
  parsed: URL,
  timeoutMs: number
): Promise<FallbackMetadata | null> {
  const provider = findOEmbedProvider(parsed);
  if (!provider || timeoutMs <= 0) return null;

  try {
    const separator = provider.endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${provider.endpoint}${separator}url=${encodeURIComponent(parsed.toString())}`, {
      headers: { 'User-Agent': CRAWLER_USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as Record<string, unknown>;
    const str = (key: string) => (typeof body[key] === 'string' && (body[key] as string).trim() ? (body[key] as string).trim() : undefined);

    const html = str('html');
    const result: FallbackMetadata = { platform: provider.platform };

    result.title = str('title') ?? (provider.kind === 'social' && html ? postTextFromEmbedHtml(html) : undefined);
    result.description = str('description');
    result.publishedDate = str('upload_date') ?? (html ? dateFromEmbedHtml(html) : undefined);

    const authorName = str('author_name');
    if (authorName) {
      if (provider.kind === 'video') {
        result.channelName = authorName;
      } else if (provider.kind === 'social') {
        // Bluesky formats author_name as "Display Name (@handle)".
        const inline = authorName.match(/^(.*?)\s*\(@([^)]+)\)$/);
        result.author = inline ? inline[1] || authorName : authorName;
        result.handle = socialHandle(provider, authorName, inline?.[2], str('author_unique_id'), str('author_url'));
      } else {
        result.author = authorName;
      }
    }

    if (!result.title) return null;
    return Object.fromEntries(Object.entries(result).filter(([, v]) => v !== undefined)) as FallbackMetadata;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 4. Internet Archive
// ---------------------------------------------------------------------------

export interface WaybackSnapshot {
  html: string;
  /** Wayback timestamp, YYYYMMDDhhmmss */
  timestamp: string;
  snapshotUrl: string;
}

/** "20200311195948" → "2020-03-11" */
export function formatWaybackDate(timestamp: string): string {
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
}

const WAYBACK_HEADERS = { 'User-Agent': CRAWLER_USER_AGENT, Accept: 'text/html,application/xhtml+xml' };

function waybackTimestampNow(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  );
}

/**
 * Timestamps of the most recent captures that were real 200 pages, newest
 * first. Sites that block bots usually block the archive's crawler too, so
 * their latest captures are often archived 403 walls; the CDX index lets us
 * skip those. Returns null when the index itself could not be queried.
 */
async function latestSuccessfulCaptures(url: string, timeoutMs: number): Promise<string[] | null> {
  if (timeoutMs <= 0) return null;
  try {
    const response = await fetch(
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp&filter=statuscode:200&limit=-3&fastLatest=true`,
      { headers: { 'User-Agent': CRAWLER_USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) }
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows)) return null;
    return rows
      .slice(1) // header row
      .map((row) => (Array.isArray(row) ? row[0] : undefined))
      .filter((ts): ts is string => typeof ts === 'string' && /^\d{14}$/.test(ts))
      .reverse();
  } catch {
    return null;
  }
}

/**
 * Fetch an Internet Archive capture of the page as original HTML (the `id_`
 * flag returns the archived bytes without the Wayback toolbar or rewritten
 * links). Captures are tried newest first; `isUsable` lets the caller reject
 * archived bot walls that were served with a 200. When the capture index is
 * unavailable, the capture closest to now is tried instead.
 */
export async function fetchWaybackSnapshot(
  url: string,
  timeoutMs: number,
  isUsable: (html: string) => boolean = () => true
): Promise<WaybackSnapshot | null> {
  if (timeoutMs <= 1000) return null;
  const deadline = Date.now() + timeoutMs;
  const remaining = () => deadline - Date.now();

  const indexed = await latestSuccessfulCaptures(url, Math.min(remaining(), 8_000));
  if (indexed && indexed.length === 0) return null; // never captured successfully
  const candidates = indexed ?? [waybackTimestampNow()];

  for (const candidate of candidates) {
    if (remaining() <= 1000) return null;
    try {
      const fetched = await safeFetchText(`https://web.archive.org/web/${candidate}id_/${url}`, {
        timeoutMs: remaining(),
        maxBytes: 5 * 1024 * 1024,
        headers: WAYBACK_HEADERS,
      });
      if (!fetched.ok || !fetched.text || !isUsable(fetched.text)) continue;
      // The archive may redirect to the nearest capture; its URL carries the real timestamp.
      const stamp = fetched.finalUrl.match(/\/web\/(\d{14})id_\//);
      if (!stamp) continue;
      return { html: fetched.text, timestamp: stamp[1], snapshotUrl: fetched.finalUrl };
    } catch {
      continue;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 5. Inference from the URL alone
// ---------------------------------------------------------------------------

const KNOWN_SITE_NAMES: Record<string, string> = {
  'nytimes.com': 'The New York Times',
  'washingtonpost.com': 'The Washington Post',
  'wsj.com': 'The Wall Street Journal',
  'theguardian.com': 'The Guardian',
  'bbc.com': 'BBC',
  'bbc.co.uk': 'BBC',
  'reuters.com': 'Reuters',
  'apnews.com': 'AP News',
  'cnn.com': 'CNN',
  'bloomberg.com': 'Bloomberg',
  'ft.com': 'Financial Times',
  'economist.com': 'The Economist',
  'forbes.com': 'Forbes',
  'wired.com': 'WIRED',
  'theatlantic.com': 'The Atlantic',
  'newyorker.com': 'The New Yorker',
  'latimes.com': 'Los Angeles Times',
  'medium.com': 'Medium',
  'substack.com': 'Substack',
  'linkedin.com': 'LinkedIn',
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'threads.net': 'Threads',
  'x.com': 'X',
  'twitter.com': 'X',
  'reddit.com': 'Reddit',
  'tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'pinterest.com': 'Pinterest',
  'quora.com': 'Quora',
  'amazon.com': 'Amazon',
  'sciencedirect.com': 'ScienceDirect',
  'jstor.org': 'JSTOR',
  'researchgate.net': 'ResearchGate',
  'academia.edu': 'Academia.edu',
  'onlinelibrary.wiley.com': 'Wiley Online Library',
  'tandfonline.com': 'Taylor & Francis Online',
  'link.springer.com': 'SpringerLink',
  'nature.com': 'Nature',
  'science.org': 'Science',
  'statista.com': 'Statista',
};

/** Human-readable site name for a hostname, falling back to the bare domain. */
export function siteNameFromHost(hostname: string): string {
  const host = normalizeHost(hostname);
  const labels = host.split('.');
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join('.');
    if (KNOWN_SITE_NAMES[candidate]) return KNOWN_SITE_NAMES[candidate];
  }
  return host;
}

const SMALL_WORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but', 'by', 'with', 'vs', 'from', 'as']);

function isIdToken(token: string): boolean {
  if (/^\d+$/.test(token)) return true;
  const digits = (token.match(/\d/g) || []).length;
  return token.length >= 6 && digits >= 3 && /[a-z]/i.test(token);
}

/**
 * Turn the most descriptive path segment into a headline, e.g.
 * /2020/03/11/health/coronavirus-pandemic-who.html → "Coronavirus Pandemic Who".
 * Returns undefined when no segment looks like words.
 */
export function titleFromPath(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean).map(safeDecode).reverse();
  for (const segment of segments) {
    const words = segment
      .replace(/\.(?:html?|php|aspx?|jsp|cfm|shtml|pdf)$/i, '')
      .split(/[-_+\s]+/)
      .map((w) => w.trim())
      .filter(Boolean);
    while (words.length && isIdToken(words[words.length - 1])) words.pop();
    while (words.length && isIdToken(words[0])) words.shift();
    const alphabetic = words.filter((w) => /^[a-z][a-z'’]*$/i.test(w));
    if (words.length < 2 || alphabetic.length < 2) continue;
    return words
      .map((w, i) => {
        const lower = w.toLowerCase();
        if (i > 0 && SMALL_WORDS.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }
  return undefined;
}

/** A publication date encoded in the path (/2020/03/11/ or 2020-03-11). */
export function dateFromPath(pathname: string): string | undefined {
  const maxYear = new Date().getFullYear() + 1;
  const valid = (y: string, m: string, d?: string) => {
    const year = Number(y);
    const month = Number(m);
    const day = d === undefined ? 1 : Number(d);
    return year >= 1990 && year <= maxYear && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  };
  const pad = (n: string) => n.padStart(2, '0');

  const slashed = pathname.match(/(?:^|\/)((?:19|20)\d{2})\/(\d{1,2})(?:\/(\d{1,2}))?(?=\/|$)/);
  if (slashed && valid(slashed[1], slashed[2], slashed[3])) {
    return slashed[3] ? `${slashed[1]}-${pad(slashed[2])}-${pad(slashed[3])}` : `${slashed[1]}-${pad(slashed[2])}`;
  }
  const dashed = pathname.match(/(?:^|[/_-])((?:19|20)\d{2})-(\d{2})-(\d{2})(?=[/_.-]|$)/);
  if (dashed && valid(dashed[1], dashed[2], dashed[3])) {
    return `${dashed[1]}-${dashed[2]}-${dashed[3]}`;
  }
  return undefined;
}

/** Last-resort metadata when the page itself is unreachable. */
export function inferFromUrl(parsed: URL): FallbackMetadata {
  const result: FallbackMetadata = { siteName: siteNameFromHost(parsed.hostname) };
  const title = titleFromPath(parsed.pathname);
  if (title) result.title = title;
  const date = dateFromPath(parsed.pathname);
  if (date) result.publishedDate = date;
  return result;
}

// ---------------------------------------------------------------------------
// User-facing copy
// ---------------------------------------------------------------------------

const REASON_LEAD: Record<BlockReason, string> = {
  blocked: 'This site blocks automated access, so',
  unreachable: 'This page could not be reached, so',
  unavailable: 'This site is currently unavailable, so',
  gone: 'This page no longer exists at that address, so',
};

export function archiveWarning(reason: BlockReason, timestamp: string): string {
  return `${REASON_LEAD[reason]} the details were loaded from an Internet Archive snapshot taken on ${formatWaybackDate(timestamp)}. Please verify them before citing.`;
}

export function inferredWarning(reason: BlockReason, hasTitle: boolean): string {
  return hasTitle
    ? `${REASON_LEAD[reason]} the fields below were inferred from the URL. Please check the title, author, and date before citing.`
    : `${REASON_LEAD[reason]} no details could be found. The URL and site name were filled in. Please add the title, author, and date manually.`;
}
