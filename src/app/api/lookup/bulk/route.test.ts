import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/app/api/lookup/url/route', () => ({ POST: vi.fn() }));
vi.mock('@/app/api/lookup/doi/route', () => ({ POST: vi.fn() }));
vi.mock('@/app/api/lookup/isbn/route', () => ({ POST: vi.fn() }));

import { POST as mockUrlPOST } from '@/app/api/lookup/url/route';
import { POST as mockDoiPOST } from '@/app/api/lookup/doi/route';
import { POST as mockIsbnPOST } from '@/app/api/lookup/isbn/route';

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
    (mockUrlPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Example Page' } }, { status: 200 })
    );
    const response = await POST(makeRequest({ items: ['https://example.com'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Example Page');
    expect(mockUrlPOST).toHaveBeenCalled();
  });

  it('routes DOIs to /api/lookup/doi', async () => {
    (mockDoiPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Research Article' } }, { status: 200 })
    );
    const response = await POST(makeRequest({ items: ['10.1000/xyz123'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(mockDoiPOST).toHaveBeenCalled();
  });

  it('routes ISBNs to /api/lookup/isbn', async () => {
    (mockIsbnPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Book Title' } }, { status: 200 })
    );
    const response = await POST(makeRequest({ items: ['9780316769174'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(mockIsbnPOST).toHaveBeenCalled();
  });

  it('marks item as failed when sub-request fails', async () => {
    (mockDoiPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ error: 'Not found' }, { status: 404 })
    );
    const response = await POST(makeRequest({ items: ['10.1000/nonexistent'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('Not found');
  });

  it('returns summary counts', async () => {
    (mockUrlPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'A' } }, { status: 200 })
    );
    (mockDoiPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ error: 'fail' }, { status: 404 })
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
    (mockUrlPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'URL result' } }, { status: 200 })
    );
    (mockDoiPOST as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'DOI result' } }, { status: 200 })
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
