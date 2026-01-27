import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('DOI Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when DOI is missing', async () => {
    const request = new NextRequest('http://localhost/api/lookup/doi', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('DOI is required');
  });

  it('should extract DOI from various formats', async () => {
    const mockCrossRefResponse = {
      status: 'ok',
      'message-type': 'work',
      'message-version': '1.0.0',
      message: {
        DOI: '10.1000/test',
        type: 'journal-article',
        title: ['Test Article'],
        author: [
          { given: 'John', family: 'Smith' },
        ],
        'container-title': ['Test Journal'],
        publisher: 'Test Publisher',
        published: {
          'date-parts': [[2020, 1, 15]],
        },
        volume: '42',
        issue: '3',
        page: '123-145',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrossRefResponse,
    });

    const request = new NextRequest('http://localhost/api/lookup/doi', {
      method: 'POST',
      body: JSON.stringify({ doi: '10.1000/test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.doi).toBe('10.1000/test');
    expect(data.data.title).toBe('Test Article');
  });

  it('should handle DOI in URL format', async () => {
    const mockCrossRefResponse = {
      status: 'ok',
      message: {
        DOI: '10.1000/test',
        type: 'journal-article',
        title: ['Test Article'],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrossRefResponse,
    });

    const request = new NextRequest('http://localhost/api/lookup/doi', {
      method: 'POST',
      body: JSON.stringify({ doi: 'https://doi.org/10.1000/test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle DOI not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = new NextRequest('http://localhost/api/lookup/doi', {
      method: 'POST',
      body: JSON.stringify({ doi: '10.1000/nonexistent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  it('should handle invalid DOI format', async () => {
    const request = new NextRequest('http://localhost/api/lookup/doi', {
      method: 'POST',
      body: JSON.stringify({ doi: 'invalid-doi' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid DOI format');
  });
});
