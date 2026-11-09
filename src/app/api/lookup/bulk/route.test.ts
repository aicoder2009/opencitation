import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

vi.mock('@/app/api/lookup/url/route', () => ({
  POST: vi.fn(async (req) => {
    const data = await req.json();
    if (data.url === 'https://example.com' || data.url === 'https://url-test.com') {
      return new Response(JSON.stringify({ data: { title: data.url === 'https://example.com' ? 'Example Page' : 'URL result' } }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  })
}));

vi.mock('@/app/api/lookup/doi/route', () => ({
  POST: vi.fn(async (req) => {
    const data = await req.json();
    if (data.doi === '10.1000/xyz123' || data.doi === '10.1234/test') {
      return new Response(JSON.stringify({ data: { title: 'DOI result' } }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  })
}));

vi.mock('@/app/api/lookup/isbn/route', () => ({
  POST: vi.fn(async (req) => {
    const data = await req.json();
    if (data.isbn === '9780316769174') {
      return new Response(JSON.stringify({ data: { title: 'ISBN result' } }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  })
}));

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/lookup/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('Bulk Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when items is missing', async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Items array/i);
  });

  it('returns 400 when items is empty', async () => {
    const response = await POST(makeRequest({ items: [] }));
    await response.json();
    expect(response.status).toBe(400);
  });

  it('returns 400 when items exceeds 20', async () => {
    const items = Array.from({ length: 21 }, (_, i) => `10.1000/item${i}`);
    const response = await POST(makeRequest({ items }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Maximum 20/i);
  });

  it('marks empty string items as failed', async () => {
    const response = await POST(makeRequest({ items: ['  '] }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toMatch(/Empty/i);
  });

  it('rejects unrecognized formats', async () => {
    const response = await POST(makeRequest({ items: ['not-a-url-or-doi-or-isbn'] }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toMatch(/Unrecognized/i);
  });

  it('routes URLs to /api/lookup/url', async () => {
    const response = await POST(makeRequest({ items: ['https://example.com'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Example Page');
  });

  it('routes DOIs to /api/lookup/doi', async () => {
    const response = await POST(makeRequest({ items: ['10.1000/xyz123'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('DOI result');
  });

  it('routes ISBNs to /api/lookup/isbn', async () => {
    const response = await POST(makeRequest({ items: ['9780316769174'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('ISBN result');
  });

  it('marks item as failed when sub-request fails', async () => {
    const response = await POST(makeRequest({ items: ['10.1000/nonexistent'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('Not found');
  });

  it('returns summary counts', async () => {
    const response = await POST(
      makeRequest({ items: ['https://example.com', '10.1000/nonexistent'] })
    );
    const data = await response.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.success).toBe(1);
    expect(data.summary.failed).toBe(1);
  });

  it('handles mixed item types in one batch', async () => {
    const response = await POST(
      makeRequest({ items: ['https://url-test.com', '10.1234/test'] })
    );
    const data = await response.json();
    expect(data.summary.success).toBe(2);
    expect(data.results[0].data.title).toBe('URL result');
    expect(data.results[1].data.title).toBe('DOI result');
  });
});
