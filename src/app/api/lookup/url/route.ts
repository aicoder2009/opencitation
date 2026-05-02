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
import type { SourceType } from '@/types';
import { safeFetchText, SafeFetchError } from '@/lib/security/safe-fetch';

interface MetadataResult {
  title?: string;
  description?: string;
  author?: string;
  authors?: Array<{ firstName?: string; lastName: string }> | string[];
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
  // Suggested source type based on URL pattern (auto-detect)
  suggestedSourceType?: SourceType;
  // Type-specific fields that the URL maps to
  arxivId?: string;
  preprintId?: string;
  repository?: string;
  journalTitle?: string;
  channelName?: string;
  platform?: string;
  handle?: string;
  postType?: string;
  encyclopediaTitle?: string;
  showName?: string;
  album?: string;
  company?: string;
  modelName?: string;
  doi?: string;
  publicationDate?: { year?: number; month?: number; day?: number };
  abstract?: string;
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

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL syntax up-front so detection logic has a parsed instance.
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Restrict outbound fetches to known, intended public hosts.
    // This removes attacker control over destination hostnames (primary SSRF vector).
    const ALLOWED_HOSTS = [
      'arxiv.org',
      'www.arxiv.org',
      'doi.org',
      'dx.doi.org',
      'openreview.net',
      'github.com',
      'www.github.com',
      'x.com',
      'twitter.com',
      'www.twitter.com',
      'youtube.com',
      'www.youtube.com',
      'youtu.be',
    ];
    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`)
    );
    if (!isAllowedHost) {
      return NextResponse.json(
        { success: false, error: 'URL host is not allowed' },
        { status: 400 }
      );
    }

    // Detect the source type from the URL and grab any type-specific hints
    const detection = detectSourceTypeFromUrl(parsedUrl);

    // For arXiv URLs, short-circuit to the arXiv API which gives richer metadata
    if (detection.sourceType === 'preprint' && detection.arxivId) {
      const arxivData = await fetchArxivMetadata(detection.arxivId);
      if (arxivData) {
        return NextResponse.json({
          success: true,
          data: {
            ...arxivData,
            suggestedSourceType: 'preprint',
            preprintId: detection.arxivId,
            repository: 'arXiv',
            url: arxivData.url || parsedUrl.toString(),
          },
        });
      }
    }

    // Fetch the page through the SSRF-aware fetcher: protocol allowlist,
    // private/loopback/link-local IP rejection, and a 5MB response cap.
    let fetched: { status: number; ok: boolean; text: string };
    try {
      fetched = await safeFetchText(parsedUrl.toString(), {
        timeoutMs: 10_000,
        maxBytes: 5 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      if (err instanceof SafeFetchError) {
        const status = err.code === 'too_large' ? 413 : 400;
        return NextResponse.json(
          { success: false, error: 'This URL cannot be fetched.' },
          { status }
        );
      }
      throw err;
    }

    if (!fetched.ok) {
      let errorMessage = `Failed to fetch URL: ${fetched.status}`;
      if (fetched.status === 401 || fetched.status === 403) {
        errorMessage = 'This website requires authentication or blocks automated access. Please use Manual Entry instead.';
      } else if (fetched.status === 404) {
        errorMessage = 'Page not found. Please check the URL.';
      } else if (fetched.status >= 500) {
        errorMessage = 'The website is currently unavailable. Please try again later.';
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 502 }
      );
    }

    const metadata = parseMetadata(fetched.text, parsedUrl.toString());

    // Merge in hostname-based type detection and hints
    if (detection.sourceType) metadata.suggestedSourceType = detection.sourceType;
    if (detection.handle) metadata.handle = detection.handle;
    if (detection.platform) metadata.platform = detection.platform;
    if (detection.postType) metadata.postType = detection.postType;
    if (detection.channelName) metadata.channelName = detection.channelName;
    if (detection.company) metadata.company = detection.company;
    if (detection.modelName) metadata.modelName = detection.modelName;
    if (detection.repository) metadata.repository = detection.repository;

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

interface UrlDetection {
  sourceType?: SourceType;
  arxivId?: string;
  handle?: string;
  platform?: string;
  postType?: string;
  channelName?: string;
  company?: string;
  modelName?: string;
  repository?: string;
}

/**
 * Detect the source type from a URL's hostname and path.
 * This lets the Quick-Add flow auto-select the right source type so
 * the generated citation includes the correct descriptor/fields.
 */
function detectSourceTypeFromUrl(parsed: URL): UrlDetection {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname;

  // arXiv — /abs/<id> or /pdf/<id>
  if (host === 'arxiv.org' || host.endsWith('.arxiv.org')) {
    const m = path.match(/\/(?:abs|pdf)\/([^\s/?]+)/i);
    return {
      sourceType: 'preprint',
      repository: 'arXiv',
      arxivId: m ? m[1].replace(/\.pdf$/, '') : undefined,
    };
  }

  // Other preprint repositories
  if (host === 'biorxiv.org' || host.endsWith('.biorxiv.org')) {
    return { sourceType: 'preprint', repository: 'bioRxiv' };
  }
  if (host === 'medrxiv.org' || host.endsWith('.medrxiv.org')) {
    return { sourceType: 'preprint', repository: 'medRxiv' };
  }
  if (host === 'ssrn.com' || host.endsWith('.ssrn.com')) {
    return { sourceType: 'preprint', repository: 'SSRN' };
  }
  if (host === 'osf.io' || host.endsWith('.osf.io')) {
    return { sourceType: 'preprint', repository: 'OSF Preprints' };
  }

  // Datasets
  if (host === 'zenodo.org' || host === 'figshare.com' || host === 'datadryad.org') {
    return { sourceType: 'dataset', repository: host };
  }
  if (host === 'data.gov' || host.endsWith('.data.gov')) {
    return { sourceType: 'dataset', repository: 'data.gov' };
  }

  // Software repositories
  if (host === 'github.com' || host === 'gitlab.com' || host === 'bitbucket.org') {
    return { sourceType: 'software', repository: host };
  }
  if (host === 'npmjs.com' || host === 'pypi.org' || host === 'crates.io' || host === 'rubygems.org') {
    return { sourceType: 'software', repository: host };
  }

  // Video platforms
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
    return { sourceType: 'video', platform: 'YouTube' };
  }
  if (host === 'vimeo.com') {
    return { sourceType: 'video', platform: 'Vimeo' };
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    return { sourceType: 'video', platform: 'TikTok' };
  }

  // Social media
  if (host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com') {
    const m = path.match(/^\/([^/]+)/);
    return { sourceType: 'social-media', platform: 'X (Twitter)', handle: m ? `@${m[1]}` : undefined, postType: 'tweet' };
  }
  if (host === 'mastodon.social' || host.endsWith('mastodon.social')) {
    return { sourceType: 'social-media', platform: 'Mastodon', postType: 'post' };
  }
  if (host === 'bsky.app') {
    return { sourceType: 'social-media', platform: 'Bluesky', postType: 'post' };
  }
  if (host === 'facebook.com' || host === 'm.facebook.com') {
    return { sourceType: 'social-media', platform: 'Facebook', postType: 'post' };
  }
  if (host === 'instagram.com') {
    const isReel = path.includes('/reel/');
    return { sourceType: 'social-media', platform: 'Instagram', postType: isReel ? 'reel' : 'post' };
  }
  if (host === 'linkedin.com') {
    return { sourceType: 'social-media', platform: 'LinkedIn', postType: 'post' };
  }
  if (host === 'threads.net') {
    return { sourceType: 'social-media', platform: 'Threads', postType: 'post' };
  }
  if (host === 'reddit.com' || host === 'old.reddit.com') {
    return { sourceType: 'social-media', platform: 'Reddit', postType: 'post' };
  }

  // AI chat tools
  if (host === 'chat.openai.com' || host === 'chatgpt.com') {
    return { sourceType: 'ai-generated', company: 'OpenAI', modelName: 'ChatGPT' };
  }
  if (host === 'claude.ai') {
    return { sourceType: 'ai-generated', company: 'Anthropic', modelName: 'Claude' };
  }
  if (host === 'gemini.google.com' || host === 'bard.google.com') {
    return { sourceType: 'ai-generated', company: 'Google', modelName: 'Gemini' };
  }
  if (host === 'copilot.microsoft.com') {
    return { sourceType: 'ai-generated', company: 'Microsoft', modelName: 'Copilot' };
  }
  if (host === 'perplexity.ai' || host === 'www.perplexity.ai') {
    return { sourceType: 'ai-generated', company: 'Perplexity AI', modelName: 'Perplexity' };
  }

  // Music / podcasts
  if (host === 'open.spotify.com' || host === 'spotify.com') {
    if (path.startsWith('/track/')) return { sourceType: 'song', platform: 'Spotify' };
    if (path.startsWith('/album/')) return { sourceType: 'album', platform: 'Spotify' };
    if (path.startsWith('/episode/') || path.startsWith('/show/')) {
      return { sourceType: 'podcast-episode', platform: 'Spotify' };
    }
    return { sourceType: 'song', platform: 'Spotify' };
  }
  if (host === 'music.apple.com') {
    if (path.includes('/album/')) return { sourceType: 'album', platform: 'Apple Music' };
    return { sourceType: 'song', platform: 'Apple Music' };
  }
  if (host === 'podcasts.apple.com' || host === 'overcast.fm' || host === 'pca.st') {
    return { sourceType: 'podcast-episode', platform: host };
  }
  if (host === 'soundcloud.com') {
    return { sourceType: 'song', platform: 'SoundCloud' };
  }
  if (host === 'bandcamp.com' || host.endsWith('.bandcamp.com')) {
    return { sourceType: 'album', platform: 'Bandcamp' };
  }

  // Encyclopedias
  if (host.endsWith('wikipedia.org')) {
    return { sourceType: 'encyclopedia' };
  }
  if (host === 'britannica.com' || host === 'www.britannica.com') {
    return { sourceType: 'encyclopedia' };
  }
  if (host === 'plato.stanford.edu') {
    return { sourceType: 'encyclopedia' };
  }

  // News / journal shortcuts
  if (host === 'nytimes.com' || host === 'washingtonpost.com' || host === 'wsj.com' ||
      host === 'theguardian.com' || host === 'bbc.com' || host === 'bbc.co.uk' ||
      host === 'reuters.com' || host === 'apnews.com' || host === 'cnn.com') {
    return { sourceType: 'newspaper' };
  }

  // Blog platforms
  if (host === 'medium.com' || host.endsWith('.medium.com') ||
      host === 'substack.com' || host.endsWith('.substack.com') ||
      host === 'wordpress.com' || host.endsWith('.wordpress.com') ||
      host === 'blogspot.com' || host.endsWith('.blogspot.com') ||
      host === 'dev.to' || host === 'hashnode.com' || host.endsWith('.hashnode.dev')) {
    return { sourceType: 'blog' };
  }

  // Video games storefronts
  if (host === 'store.steampowered.com' || host === 'gog.com' ||
      host === 'epicgames.com' || host === 'itch.io' || host.endsWith('.itch.io')) {
    return { sourceType: 'video-game' };
  }

  return {};
}

/**
 * Query arXiv directly for rich preprint metadata when we see an arXiv URL.
 * Returns fields shaped like the standard URL lookup response so the
 * existing client-side field builder can consume it unchanged.
 */
async function fetchArxivMetadata(arxivId: string): Promise<MetadataResult | null> {
  try {
    const apiUrl = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'OpenCitation/1.0 (https://opencitation.com)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    if (!xml.includes('<entry>')) return null;

    const result: MetadataResult = {
      url: `https://arxiv.org/abs/${arxivId}`,
    };

    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) return null;
    const entry = entryMatch[1];

    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    if (titleMatch) result.title = titleMatch[1].replace(/\s+/g, ' ').trim();

    const authors: Array<{ firstName?: string; lastName: string }> = [];
    const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
    for (const match of authorMatches) {
      const fullName = match[1].trim();
      const parts = fullName.split(/\s+/);
      if (parts.length === 1) {
        authors.push({ lastName: parts[0] });
      } else {
        const lastName = parts.pop() || '';
        authors.push({ firstName: parts.join(' '), lastName });
      }
    }
    if (authors.length > 0) result.authors = authors;

    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    if (publishedMatch) {
      const date = new Date(publishedMatch[1]);
      if (!Number.isNaN(date.getTime())) {
        result.publicationDate = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
        };
      }
    }

    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    if (summaryMatch) result.abstract = summaryMatch[1].replace(/\s+/g, ' ').trim();

    const doiMatch = entry.match(/<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/);
    if (doiMatch) result.doi = doiMatch[1];

    return result;
  } catch {
    return null;
  }
}

