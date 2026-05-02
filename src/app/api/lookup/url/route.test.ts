import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/security/safe-fetch', async () => {
  const actual = await vi.importActual<typeof import('@/lib/security/safe-fetch')>(
    '@/lib/security/safe-fetch'
  );
  return {
    ...actual,
    safeFetchText: vi.fn(),
  };
});

import { POST } from './route';
import { safeFetchText } from '@/lib/security/safe-fetch';

const mockSafeFetch = safeFetchText as unknown as ReturnType<typeof vi.fn>;

// Mock fetch globally for routes that still call it directly (e.g. arXiv side-quest)
global.fetch = vi.fn();

describe('URL Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when URL is missing', async () => {
    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('URL is required');
  });

  it('should return error for invalid URL format', async () => {
    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({ url: 'not-a-valid-url' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid URL format');
  });

  it('should extract metadata from HTML', async () => {
    const mockHtml = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="Test description">
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
        </head>
        <body>Content</body>
      </html>
    `;

    mockSafeFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: mockHtml,
      finalUrl: 'https://example.com',
    });

    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.title).toBeTruthy();
  });

  it('should handle fetch errors', async () => {
    mockSafeFetch.mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('should handle timeout errors', async () => {
    const abortError = new Error('Timeout');
    abortError.name = 'AbortError';
    mockSafeFetch.mockRejectedValueOnce(abortError);

    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
    expect(data.error).toContain('timed out');
  });

  it('should handle non-200 responses', async () => {
    mockSafeFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: '',
      finalUrl: 'https://example.com',
    });

    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
  });

  it('should reject SSRF blocks with 400', async () => {
    const { SafeFetchError } = await import('@/lib/security/safe-fetch');
    mockSafeFetch.mockRejectedValueOnce(
      new SafeFetchError('blocked', 'blocked_address')
    );

    const request = new NextRequest('http://localhost/api/lookup/url', {
      method: 'POST',
      body: JSON.stringify({ url: 'http://169.254.169.254/' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
