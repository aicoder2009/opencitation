import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
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

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
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
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

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
    (global.fetch as any).mockRejectedValueOnce(abortError);

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
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
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
});
