import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/posthog-server', () => ({
  getPostHogClient: vi.fn(() => ({ capture: vi.fn() })),
}));

global.fetch = vi.fn();

import { auth } from '@clerk/nextjs/server';
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/report-issue', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: 'Citation is wrong',
  description: 'The APA format has an error.',
  issueType: 'Bug',
  email: 'user@example.com',
};

const GITHUB_ISSUE_RESPONSE = {
  number: 42,
  html_url: 'https://github.com/aicoder2009/opencitation/issues/42',
};

describe('Report Issue API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    process.env.GITHUB_TOKEN = 'test-token';
  });

  it('returns 400 when title is missing', async () => {
    const response = await POST(makeRequest({ description: 'Desc' }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/required/i);
  });

  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({ title: 'Title' }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 500 when GITHUB_TOKEN is not set', async () => {
    delete process.env.GITHUB_TOKEN;
    const response = await POST(makeRequest(validBody));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/not configured/i);
  });

  it('creates a GitHub issue successfully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => GITHUB_ISSUE_RESPONSE,
    });
    const response = await POST(makeRequest(validBody));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.issueNumber).toBe(42);
    expect(data.issueUrl).toContain('/issues/42');
  });

  it('includes issue type and contact in GitHub body', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => GITHUB_ISSUE_RESPONSE,
    });
    await POST(makeRequest(validBody));
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { body: string },
    ];
    const githubBody = JSON.parse(options.body);
    expect(githubBody.title).toBe('[User Report] Citation is wrong');
    expect(githubBody.body).toContain('Bug');
    expect(githubBody.body).toContain('user@example.com');
    expect(githubBody.labels).toContain('user-reported');
  });

  it('returns 500 when GitHub API call fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Bad credentials' }),
    });
    const response = await POST(makeRequest(validBody));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Failed to create issue/i);
  });

  it('works for unauthenticated users (anonymous)', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => GITHUB_ISSUE_RESPONSE,
    });
    const response = await POST(makeRequest(validBody));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('handles missing email gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => GITHUB_ISSUE_RESPONSE,
    });
    const response = await POST(
      makeRequest({ title: 'Issue', description: 'Details' })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network failure')
    );
    const response = await POST(makeRequest(validBody));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Internal server error/i);
  });
});
