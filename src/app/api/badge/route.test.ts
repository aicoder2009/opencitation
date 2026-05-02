import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/db', () => ({
  getStats: vi.fn(),
}));

import { getStats } from '@/lib/db';
const mockGetStats = getStats as unknown as ReturnType<typeof vi.fn>;

describe('Badge API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns SVG content type', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 0 });
    const response = await GET();
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('returns 200 status', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 0 });
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns valid SVG markup', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 0 });
    const response = await GET();
    const svg = await response.text();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('shows "Cite with OpenCitation" text', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 0 });
    const response = await GET();
    const svg = await response.text();
    expect(svg).toContain('Cite with OpenCitation');
  });

  it('shows count bubble when citationsGenerated > 0', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 500 });
    const response = await GET();
    const svg = await response.text();
    expect(svg).toContain('500');
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
  });

  it('formats counts >= 1000 as K', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 2500 });
    const response = await GET();
    const svg = await response.text();
    expect(svg).toContain('2.5K');
  });

  it('formats counts >= 1000000 as M', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 1500000 });
    const response = await GET();
    const svg = await response.text();
    expect(svg).toContain('1.5M');
  });
  it("uses wider badge width when count is shown", async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 100 });
    const withCount = await (await GET()).text();
    mockGetStats.mockResolvedValue({ citationsGenerated: 0 });
    const withoutCount = await (await GET()).text();
    const extractWidth = (svg: string) => svg.match(/width="(\d+)"/)?.[1];
    const withWidth = extractWidth(withCount);
    const withoutWidth = extractWidth(withoutCount);
    expect(withWidth && withoutWidth && parseInt(withWidth)).toBeGreaterThan(parseInt(withoutWidth));
  });
  it('returns fallback SVG when db throws', async () => {
    mockGetStats.mockRejectedValue(new Error('db error'));
    const response = await GET();
    expect(response.status).toBe(200);
    const svg = await response.text();
    expect(svg).toContain('<svg');
    expect(svg).toContain('Cite with OpenCitation');
  });
});
