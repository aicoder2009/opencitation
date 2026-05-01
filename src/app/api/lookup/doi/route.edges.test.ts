import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

function makePost(body: object) {
  return new NextRequest('http://localhost/api/lookup/doi', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function makeGet(doi: string) {
  return new NextRequest(`http://localhost/api/lookup/doi?doi=${encodeURIComponent(doi)}`);
}

const CROSSREF_BASE = {
  status: 'ok',
  'message-type': 'work',
  'message-version': '1.0.0',
  message: {
    DOI: '10.1000/xyz123',
    type: 'journal-article',
    title: ['Test Article'],
    publisher: 'Test Publisher',
  },
};

describe('DOI Lookup – extractDOI edge cases', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts dx.doi.org URL format', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => CROSSREF_BASE,
    });
    const response = await POST(makePost({ doi: 'https://dx.doi.org/10.1000/xyz123' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('accepts bare doi: prefix', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => CROSSREF_BASE,
    });
    const response = await POST(makePost({ doi: 'doi:10.1000/xyz123' }));
    expect(response.status).toBe(200);
  });

  it('returns 400 for non-DOI URL', async () => {
    const response = await POST(makePost({ doi: 'https://example.com/not-a-doi' }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/Invalid DOI/i);
  });

  it('handles AbortError as 504', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error('aborted'), { name: 'AbortError' })
    );
    const response = await POST(makePost({ doi: '10.1000/xyz123' }));
    expect(response.status).toBe(504);
  });

  it('handles TimeoutError as 504', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error('timeout'), { name: 'TimeoutError' })
    );
    const response = await POST(makePost({ doi: '10.1000/xyz123' }));
    expect(response.status).toBe(504);
  });
});

describe('DOI Lookup – organization author', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps name field to isOrganization author', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...CROSSREF_BASE,
        message: {
          ...CROSSREF_BASE.message,
          author: [{ name: 'World Health Organization', sequence: 'first' }],
        },
      }),
    });
    const response = await POST(makePost({ doi: '10.1000/xyz123' }));
    const data = await response.json();
    expect(data.data.authors[0].isOrganization).toBe(true);
    expect(data.data.authors[0].lastName).toBe('World Health Organization');
  });
});

describe('DOI Lookup – date with only year', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses date-parts with only year', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...CROSSREF_BASE,
        message: {
          ...CROSSREF_BASE.message,
          published: { 'date-parts': [[2023]] },
        },
      }),
    });
    const response = await POST(makePost({ doi: '10.1000/xyz123' }));
    const data = await response.json();
    expect(data.data.publicationDate.year).toBe(2023);
    expect(data.data.publicationDate.month).toBeUndefined();
  });
});

describe('DOI Lookup – GET method', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when doi query param is missing', async () => {
    const request = new NextRequest('http://localhost/api/lookup/doi');
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/required/i);
  });

  it('accepts doi via query param and fetches metadata', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => CROSSREF_BASE,
    });
    const response = await GET(makeGet('10.1000/xyz123'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

describe('DOI Lookup – CrossRef 404', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when CrossRef says not found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    const response = await POST(makePost({ doi: '10.1000/nonexistent' }));
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/not found/i);
  });

  it('returns 502 for other CrossRef errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
    });
    const response = await POST(makePost({ doi: '10.1000/xyz123' }));
    expect(response.status).toBe(502);
  });
});
