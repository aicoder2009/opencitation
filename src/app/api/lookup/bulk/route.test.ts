import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the internal route handlers directly instead of global fetch
vi.mock('@/app/api/lookup/url/route', () => ({
  POST: vi.fn(),
}));
vi.mock('@/app/api/lookup/doi/route', () => ({
  POST: vi.fn(),
}));
vi.mock('@/app/api/lookup/isbn/route', () => ({
  POST: vi.fn(),
}));

import { POST as urlPost } from '@/app/api/lookup/url/route';
import { POST as doiPost } from '@/app/api/lookup/doi/route';
import { POST as isbnPost } from '@/app/api/lookup/isbn/route';

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
    (urlPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ data: { title: 'Example Page' } }),
    });
    const response = await POST(makeRequest({ items: ['https://example.com'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Example Page');
    expect(urlPost).toHaveBeenCalled();
  });

  it('routes DOIs to /api/lookup/doi', async () => {
    (doiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ data: { title: 'Research Article' } }),
    });
    const response = await POST(makeRequest({ items: ['10.1000/xyz123'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(doiPost).toHaveBeenCalled();
  });

  it('routes ISBNs to /api/lookup/isbn', async () => {
    (isbnPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ data: { title: 'Book Title' } }),
    });
    const response = await POST(makeRequest({ items: ['9780316769174'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(isbnPost).toHaveBeenCalled();
  });

  it('marks item as failed when sub-request fails', async () => {
    (doiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });
    const response = await POST(makeRequest({ items: ['10.1000/nonexistent'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('Not found');
  });

  it('returns summary counts', async () => {
    (urlPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 200, json: async () => ({ data: { title: 'A' } }) });
    (doiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 400, json: async () => ({ error: 'fail' }) });
    const response = await POST(
      makeRequest({ items: ['https://success.com', '10.1000/fail'] })
    );
    const data = await response.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.success).toBe(1);
    expect(data.summary.failed).toBe(1);
  });

  it('handles mixed item types in one batch', async () => {
    (urlPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 200, json: async () => ({ data: { title: 'URL result' } }) });
    (doiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 200, json: async () => ({ data: { title: 'DOI result' } }) });

    const response = await POST(
      makeRequest({ items: ['https://example.com', '10.1000/abc'] })
    );
    const data = await response.json();
    expect(data.summary.success).toBe(2);
    expect(data.results[0].data.title).toBe('URL result');
    expect(data.results[1].data.title).toBe('DOI result');
  });
});
