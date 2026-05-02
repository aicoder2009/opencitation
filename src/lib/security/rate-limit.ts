import type { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * In-memory fixed-window rate limiter. Per-process state, so it does not
 * coordinate across serverless instances — the goal is to raise the bar on
 * casual abuse, not to enforce a strict global limit.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  // Periodic cleanup: drop expired entries when the map grows.
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  return {
    ok: bucket.count <= options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/**
 * Best-effort caller identifier from common proxy headers, falling back
 * to a constant so the limiter still works behind a proxy that strips IPs.
 */
export function getClientKey(request: NextRequest, scope: string): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip =
    (fwd ? fwd.split(",")[0]?.trim() : null) ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

/**
 * Reject cross-origin POSTs from arbitrary sites by checking the Origin
 * (or Referer) header against the request URL. Same-origin requests sent
 * by the app pass; CSRF-style requests from a third-party page are blocked.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === request.nextUrl.host;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === request.nextUrl.host;
    } catch {
      return false;
    }
  }
  return false;
}

// Test-only helper.
export function _resetRateLimitForTests(): void {
  buckets.clear();
}
