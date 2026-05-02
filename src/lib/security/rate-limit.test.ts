import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { rateLimit, isSameOrigin, _resetRateLimitForTests } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    _resetRateLimitForTests();
  });

  it("allows up to the limit and rejects after", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", { limit: 3, windowMs: 1000 }).ok).toBe(true);
    }
    expect(rateLimit("k", { limit: 3, windowMs: 1000 }).ok).toBe(false);
  });

  it("tracks separate keys independently", () => {
    expect(rateLimit("a", { limit: 1, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit("b", { limit: 1, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit("a", { limit: 1, windowMs: 1000 }).ok).toBe(false);
  });
});

describe("isSameOrigin", () => {
  it("accepts same-host Origin", () => {
    const r = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { Origin: "http://localhost" },
    });
    expect(isSameOrigin(r)).toBe(true);
  });

  it("rejects cross-host Origin", () => {
    const r = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { Origin: "https://evil.example.com" },
    });
    expect(isSameOrigin(r)).toBe(false);
  });

  it("falls back to Referer when Origin is missing", () => {
    const r = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { Referer: "http://localhost/page" },
    });
    expect(isSameOrigin(r)).toBe(true);
  });

  it("rejects when both Origin and Referer are missing", () => {
    const r = new NextRequest("http://localhost/x", { method: "POST" });
    expect(isSameOrigin(r)).toBe(false);
  });
});
