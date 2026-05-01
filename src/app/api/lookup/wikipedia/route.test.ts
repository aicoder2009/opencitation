import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

const SAMPLE_WIKI_RESPONSE = {
  query: {
    pages: {
      '12345': {
        pageid: 12345,
        title: 'Artificial intelligence',
        revisions: [{ timestamp: '2024-03-15T10:00:00Z' }],
        extract: 'Artificial intelligence (AI) is intelligence demonstrated by machines.',
        pageprops: {},
      },
    },
  },
};

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/lookup/wikipedia', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('Wikipedia Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when neither url nor title provided', async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 for invalid Wikipedia URL', async () => {
    const response = await POST(makeRequest({ url: 'https://google.com/wiki/AI' }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Invalid Wikipedia/i);
  });

  it('returns 404 when article page ID is -1', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query: { pages: { '-1': { title: 'Nonexistent' } } } }),
    });
    const response = await POST(makeRequest({ title: 'Nonexistent Article XYZ' }));
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 404 when no pages returned', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    });
    const response = await POST(makeRequest({ title: 'Empty Result' }));
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 502 when Wikipedia API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
    });
    const response = await POST(makeRequest({ title: 'Artificial intelligence' }));
    const data = await response.json();
    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
  });

  it('parses a valid Wikipedia response from title', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_WIKI_RESPONSE,
    });
    const response = await POST(makeRequest({ title: 'Artificial intelligence' }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Artificial intelligence');
    expect(data.data.siteName).toBe('Wikipedia');
    expect(data.data.pageId).toBe(12345);
    expect(data.data.lastModified.year).toBe(2024);
    expect(data.data.lastModified.month).toBe(3);
    expect(data.data.description).toContain('Artificial intelligence');
    expect(data.data.accessDate).toBeDefined();
    expect(data.data.accessDate.year).toBeDefined();
  });

  it('parses from a valid Wikipedia URL and extracts language', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '999': {
              pageid: 999,
              title: 'Inteligencia artificial',
              revisions: [{ timestamp: '2024-01-01T00:00:00Z' }],
            },
          },
        },
      }),
    });
    const response = await POST(
      makeRequest({ url: 'https://es.wikipedia.org/wiki/Inteligencia_artificial' })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.language).toBe('es');
    expect(data.data.siteName).toBe('Wikipedia en español');
  });

  it('includes access date in the current year', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_WIKI_RESPONSE,
    });
    const response = await POST(makeRequest({ title: 'AI' }));
    const data = await response.json();
    const currentYear = new Date().getFullYear();
    expect(data.data.accessDate.year).toBe(currentYear);
  });

  it('returns 504 on timeout', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error('timeout'), { name: 'TimeoutError' })
    );
    const response = await POST(makeRequest({ title: 'AI' }));
    const data = await response.json();
    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
  });
});
