import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { _resetRateLimit, checkRateLimit, clientKey } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => _resetRateLimit());
  afterEach(() => vi.useRealTimers());

  it("allows requests up to capacity, then rejects", () => {
    const cfg = { capacity: 3, refillRatePerMs: 0 };
    expect(checkRateLimit("ip1", cfg).ok).toBe(true);
    expect(checkRateLimit("ip1", cfg).ok).toBe(true);
    expect(checkRateLimit("ip1", cfg).ok).toBe(true);
    const blocked = checkRateLimit("ip1", cfg);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("separates buckets by key", () => {
    const cfg = { capacity: 1, refillRatePerMs: 0 };
    expect(checkRateLimit("a", cfg).ok).toBe(true);
    // Different bucket; should still have a token.
    expect(checkRateLimit("b", cfg).ok).toBe(true);
    expect(checkRateLimit("a", cfg).ok).toBe(false);
  });

  it("refills tokens over time", () => {
    vi.useFakeTimers();
    const start = new Date(2030, 0, 1).getTime();
    vi.setSystemTime(start);

    // 1 token per second.
    const cfg = { capacity: 2, refillRatePerMs: 1 / 1000 };
    expect(checkRateLimit("ip", cfg).ok).toBe(true);
    expect(checkRateLimit("ip", cfg).ok).toBe(true);
    expect(checkRateLimit("ip", cfg).ok).toBe(false);

    // Advance 1.1s — should have ~1.1 tokens, enough for one more.
    vi.setSystemTime(start + 1_100);
    expect(checkRateLimit("ip", cfg).ok).toBe(true);
  });

  it("reports a non-zero retryAfter when blocked", () => {
    const cfg = { capacity: 1, refillRatePerMs: 1 / 5000 }; // 1 token / 5s
    expect(checkRateLimit("ip", cfg).ok).toBe(true);
    const blocked = checkRateLimit("ip", cfg);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe("clientKey", () => {
  it("prefers the leftmost IP from x-forwarded-for", () => {
    const req = new Request("http://x/", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" },
    });
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when XFF is absent", () => {
    const req = new Request("http://x/", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(clientKey(req)).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' when no header is present", () => {
    const req = new Request("http://x/");
    expect(clientKey(req)).toBe("unknown");
  });
});
