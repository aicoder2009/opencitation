import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <entry>
    <title>Attention Is All You Need</title>
    <author><name>Ashish Vaswani</name></author>
    <author><name>Noam Shazeer</name></author>
    <published>2017-06-12T00:00:00Z</published>
    <updated>2023-08-02T00:00:00Z</updated>
    <summary>We propose a new simple network architecture.</summary>
    <arxiv:doi>10.1234/example</arxiv:doi>
    <category term="cs.CL"/>
    <category term="cs.LG"/>
    <arxiv:comment>15 pages, 5 figures</arxiv:comment>
    <arxiv:journal_ref>NIPS 2017</arxiv:journal_ref>
  </entry>
</feed>`;

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/lookup/arxiv', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('arXiv Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when arxivId is missing', async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 for invalid arXiv ID format', async () => {
    const response = await POST(makeRequest({ arxivId: 'not-valid' }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Invalid arXiv/i);
  });

  it('returns 404 when arXiv response has no <entry>', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => '<feed></feed>',
    });
    const response = await POST(makeRequest({ arxivId: '2301.00001' }));
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 502 when arXiv API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
    });
    const response = await POST(makeRequest({ arxivId: '2301.00001' }));
    const data = await response.json();
    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
  });

  it('parses a valid arXiv response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_XML,
    });
    const response = await POST(makeRequest({ arxivId: '1706.03762' }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Attention Is All You Need');
    expect(data.data.authors).toHaveLength(2);
    expect(data.data.authors[0].lastName).toBe('Vaswani');
    expect(data.data.authors[0].firstName).toBe('Ashish');
    expect(data.data.publicationDate.year).toBe(2017);
    expect(data.data.doi).toBe('10.1234/example');
    expect(data.data.categories).toContain('cs.CL');
    expect(data.data.primaryCategory).toBe('cs.CL');
    expect(data.data.journalRef).toBe('NIPS 2017');
  });

  describe('ID extraction', () => {
    it('strips arXiv: prefix', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_XML,
      });
      const response = await POST(makeRequest({ arxivId: 'arXiv:2301.00001' }));
      expect(response.status).toBe(200);
    });

    it('extracts ID from arxiv.org abs URL', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_XML,
      });
      const response = await POST(makeRequest({ arxivId: 'https://arxiv.org/abs/2301.00001' }));
      expect(response.status).toBe(200);
    });

    it('accepts old-format IDs like hep-th/9901001', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_XML,
      });
      const response = await POST(makeRequest({ arxivId: 'hep-th/9901001' }));
      expect(response.status).toBe(200);
    });
  });

  it('returns 504 on timeout', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error('timeout'), { name: 'TimeoutError' })
    );
    const response = await POST(makeRequest({ arxivId: '2301.00001' }));
    const data = await response.json();
    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
  });
});
