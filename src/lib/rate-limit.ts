// In-memory rate limiter. Sufficient for low-volume, single-region deploy.
// For multi-region or higher volume, swap with a KV/Redis-backed bucket.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
// Cap the map size to prevent unbounded growth from many unique IPs.
const MAX_BUCKETS = 10_000;

export interface RateLimitConfig {
  // Bucket capacity (also the burst limit).
  capacity: number;
  // Tokens added per millisecond. e.g. 60 req/min = 1/1000.
  refillRatePerMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  // Tokens remaining after this request (0 if rejected).
  remaining: number;
  // Seconds until at least 1 token is available again.
  retryAfter: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_BUCKETS) {
      // Crude eviction: drop the oldest seen key. Fine for a soft cap.
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    bucket = { tokens: config.capacity, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time.
  const elapsed = Math.max(0, now - bucket.lastRefill);
  const refill = elapsed * config.refillRatePerMs;
  bucket.tokens = Math.min(config.capacity, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      ok: true,
      remaining: Math.floor(bucket.tokens),
      retryAfter: 0,
    };
  }
  // Not enough tokens: report when next one will be available.
  const needed = 1 - bucket.tokens;
  const retryAfterMs = needed / config.refillRatePerMs;
  return {
    ok: false,
    remaining: 0,
    retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}

// For tests.
export function _resetRateLimit(key?: string): void {
  if (key === undefined) buckets.clear();
  else buckets.delete(key);
}

// Extract a stable client identifier from a Request. Prefers the leftmost
// IP in x-forwarded-for (Vercel sets this), then x-real-ip, then a coarse
// fallback so we still bucket somehow rather than treat all callers as one.
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
