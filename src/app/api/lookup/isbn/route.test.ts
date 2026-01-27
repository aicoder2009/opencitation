import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('ISBN Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when ISBN is missing', async () => {
    const request = new NextRequest('http://localhost/api/lookup/isbn', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('ISBN is required');
  });

  it('should validate ISBN format', async () => {
    const request = new NextRequest('http://localhost/api/lookup/isbn', {
      method: 'POST',
      body: JSON.stringify({ isbn: 'invalid' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid ISBN format');
  });

  it('should fetch from Open Library', async () => {
    const mockOpenLibraryResponse = {
      'ISBN:9781234567890': {
        title: 'Test Book',
        subtitle: 'A Subtitle',
        authors: [{ name: 'John Smith' }],
        publishers: ['Test Publisher'],
        publish_date: '2020',
        number_of_pages: 300,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOpenLibraryResponse,
    });

    const request = new NextRequest('http://localhost/api/lookup/isbn', {
      method: 'POST',
      body: JSON.stringify({ isbn: '9781234567890' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.title).toBe('Test Book');
    expect(data.source).toBe('openlibrary');
  });

  it('should fallback to Google Books if Open Library fails', async () => {
    // Open Library returns empty
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    // Google Books response
    const mockGoogleBooksResponse = {
      items: [
        {
          volumeInfo: {
            title: 'Test Book',
            authors: ['John Smith'],
            publisher: 'Test Publisher',
            publishedDate: '2020',
          },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGoogleBooksResponse,
    });

    const request = new NextRequest('http://localhost/api/lookup/isbn', {
      method: 'POST',
      body: JSON.stringify({ isbn: '9781234567890' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('googlebooks');
  });

  it('should handle book not found', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

    const request = new NextRequest('http://localhost/api/lookup/isbn', {
      method: 'POST',
      body: JSON.stringify({ isbn: '9781234567890' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  it('should clean ISBN format (remove hyphens)', async () => {
    const mockResponse = {
      'ISBN:9781234567890': {
        title: 'Test Book',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const request = new NextRequest('http://localhost/api/lookup/isbn', {
      method: 'POST',
      body: JSON.stringify({ isbn: '978-123-456-789-0' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
