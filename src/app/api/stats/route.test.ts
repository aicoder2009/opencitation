import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { POST } from './increment/route';

vi.mock('@/lib/db', () => ({
  getStats: vi.fn(),
  incrementCitationCount: vi.fn(),
}));

import { getStats, incrementCitationCount } from '@/lib/db';
const mockGetStats = getStats as unknown as ReturnType<typeof vi.fn>;
const mockIncrement = incrementCitationCount as unknown as ReturnType<typeof vi.fn>;

describe('Stats API - GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stats object from db', async () => {
    mockGetStats.mockResolvedValue({ citationsGenerated: 1234 });
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.citationsGenerated).toBe(1234);
  });

  it('returns zero count on db error', async () => {
    mockGetStats.mockRejectedValue(new Error('db down'));
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.citationsGenerated).toBe(0);
  });
});

describe('Stats API - POST /api/stats/increment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success: true when increment succeeds', async () => {
    mockIncrement.mockResolvedValue(undefined);
    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns success: false with 500 when increment fails', async () => {
    mockIncrement.mockRejectedValue(new Error('write error'));
    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
