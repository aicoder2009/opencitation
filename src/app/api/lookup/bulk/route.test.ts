import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('../url/route', () => ({ POST: vi.fn() }));
vi.mock('../doi/route', () => ({ POST: vi.fn() }));
vi.mock('../isbn/route', () => ({ POST: vi.fn() }));

import { POST as urlLookup } from '../url/route';
import { POST as doiLookup } from '../doi/route';
import { POST as isbnLookup } from '../isbn/route';

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
    (urlLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Example Page' } })
    );
    const response = await POST(makeRequest({ items: ['https://example.com'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Example Page');
    expect(urlLookup).toHaveBeenCalled();
  });

  it('routes DOIs to /api/lookup/doi', async () => {
    (doiLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Research Article' } })
    );
    const response = await POST(makeRequest({ items: ['10.1000/xyz123'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(doiLookup).toHaveBeenCalled();
  });

  it('routes ISBNs to /api/lookup/isbn', async () => {
    (isbnLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Book Title' } })
    );
    const response = await POST(makeRequest({ items: ['9780316769174'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(isbnLookup).toHaveBeenCalled();
  });

  it('marks item as failed when sub-request fails', async () => {
    (doiLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ error: 'Not found' }, { status: 404 })
    );
    const response = await POST(makeRequest({ items: ['10.1000/nonexistent'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('Not found');
  });

  it('returns summary counts', async () => {
    (urlLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'A' } })
    );
    (doiLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ error: 'fail' }, { status: 400 })
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
    (urlLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'URL result' } })
    );
    (doiLookup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'DOI result' } })
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
