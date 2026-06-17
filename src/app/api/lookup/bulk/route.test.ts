import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the internal route handlers
vi.mock('../url/route', () => ({
  POST: vi.fn(),
}));
vi.mock('../doi/route', () => ({
  POST: vi.fn(),
}));
vi.mock('../isbn/route', () => ({
  POST: vi.fn(),
}));

import { POST as lookupUrl } from '../url/route';
import { POST as lookupDoi } from '../doi/route';
import { POST as lookupIsbn } from '../isbn/route';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/lookup/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mockResponse(data: any, ok: boolean = true) {
  return {
    ok,
    json: async () => data
  } as any;
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

  it('routes URLs to lookupUrl handler', async () => {
    (lookupUrl as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ data: { title: 'Example Page' } })
    );
    const response = await POST(makeRequest({ items: ['https://example.com'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Example Page');
    expect(lookupUrl).toHaveBeenCalled();
  });

  it('routes DOIs to lookupDoi handler', async () => {
    (lookupDoi as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ data: { title: 'Research Article' } })
    );
    const response = await POST(makeRequest({ items: ['10.1000/xyz123'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Research Article');
    expect(lookupDoi).toHaveBeenCalled();
  });

  it('routes ISBNs to lookupIsbn handler', async () => {
    (lookupIsbn as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ data: { title: 'Book Title' } })
    );
    const response = await POST(makeRequest({ items: ['9780316769174'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Book Title');
    expect(lookupIsbn).toHaveBeenCalled();
  });

  it('marks item as failed when sub-request fails', async () => {
    (lookupDoi as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ error: 'Not found' }, false)
    );
    const response = await POST(makeRequest({ items: ['10.1000/nonexistent'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('Not found');
  });

  it('returns summary counts', async () => {
    (lookupUrl as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ data: { title: 'A' } })
    );
    (lookupDoi as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ error: 'fail' }, false)
    );
    const response = await POST(
      makeRequest({ items: ['https://success.com', '10.1000/fail'] })
    );
    const data = await response.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.success).toBe(1);
    expect(data.summary.failed).toBe(1);
  });

  it('handles mixed item types in one batch', async () => {
    (lookupUrl as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ data: { title: 'URL result' } })
    );
    (lookupDoi as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ data: { title: 'DOI result' } })
    );
    const response = await POST(
      makeRequest({ items: ['https://example.com', '10.1000/abc'] })
    );
    const data = await response.json();
    expect(data.summary.success).toBe(2);
    expect(data.results[0].data.title).toBe('URL result');
    expect(data.results[1].data.title).toBe('DOI result');
  });
});
