import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';

const mockUrlPost = vi.fn();
const mockDoiPost = vi.fn();
const mockIsbnPost = vi.fn();

vi.mock('../url/route', () => ({
  get POST() {
    return mockUrlPost;
  }
}));

vi.mock('../doi/route', () => ({
  get POST() {
    return mockDoiPost;
  }
}));

vi.mock('../isbn/route', () => ({
  get POST() {
    return mockIsbnPost;
  }
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
    mockUrlPost.mockReset();
    mockDoiPost.mockReset();
    mockIsbnPost.mockReset();
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
    mockUrlPost.mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Example Page' } })
    );
    const response = await POST(makeRequest({ items: ['https://example.com'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(data.results[0].data.title).toBe('Example Page');
    expect(mockUrlPost).toHaveBeenCalled();
  });

  it('routes DOIs to /api/lookup/doi', async () => {
    mockDoiPost.mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Research Article' } })
    );
    const response = await POST(makeRequest({ items: ['10.1000/xyz123'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(mockDoiPost).toHaveBeenCalled();
  });

  it('routes ISBNs to /api/lookup/isbn', async () => {
    mockIsbnPost.mockResolvedValueOnce(
      NextResponse.json({ data: { title: 'Book Title' } })
    );
    const response = await POST(makeRequest({ items: ['9780316769174'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(true);
    expect(mockIsbnPost).toHaveBeenCalled();
  });

  it('marks item as failed when sub-request fails', async () => {
    mockDoiPost.mockResolvedValueOnce(
      NextResponse.json({ error: 'Not found' }, { status: 404 })
    );
    const response = await POST(makeRequest({ items: ['10.1000/nonexistent'] }));
    const data = await response.json();
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('Not found');
  });

  it('returns summary counts', async () => {
    mockUrlPost.mockResolvedValueOnce(NextResponse.json({ data: { title: 'A' } }));
    mockDoiPost.mockResolvedValueOnce(NextResponse.json({ error: 'fail' }, { status: 500 }));

    const response = await POST(
      makeRequest({ items: ['https://success.com', '10.1000/fail'] })
    );
    const data = await response.json();
    expect(data.summary.total).toBe(2);
    expect(data.summary.success).toBe(1);
    expect(data.summary.failed).toBe(1);
  });

  it('handles mixed item types in one batch', async () => {
    mockUrlPost.mockResolvedValueOnce(NextResponse.json({ data: { title: 'URL result' } }));
    mockDoiPost.mockResolvedValueOnce(NextResponse.json({ data: { title: 'DOI result' } }));

    const response = await POST(
      makeRequest({ items: ['https://example.com', '10.1000/abc'] })
    );
    const data = await response.json();
    expect(data.summary.success).toBe(2);
    // results might return in different order depending on resolving, but for testing map order is preserved
    expect(data.results.find((r: any) => r.input === 'https://example.com')?.data?.title).toBe('URL result');
    expect(data.results.find((r: any) => r.input === '10.1000/abc')?.data?.title).toBe('DOI result');
  });
});
