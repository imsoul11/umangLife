/**
 * In-memory token bucket. Suitable for a single-instance deployment;
 * swap for a shared store (e.g. Redis) when running multiple replicas.
 */
export interface RateLimitOptions {
  /** burst size */
  capacity: number;
  /** tokens restored per minute */
  refillPerMinute: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** seconds until the next token — send as the Retry-After header */
  retryAfterSec: number;
}

const buckets = new Map<string, { tokens: number; updatedAt: number }>();
const MAX_BUCKETS = 1000;
const STALE_MS = 10 * 60_000;

export function rateLimit(key: string, opts: RateLimitOptions, now = Date.now()): RateLimitResult {
  if (buckets.size >= MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (now - b.updatedAt > STALE_MS) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsedMin = (now - bucket.updatedAt) / 60_000;
  bucket.tokens = Math.min(opts.capacity, bucket.tokens + elapsedMin * opts.refillPerMinute);
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec: Math.ceil(((1 - bucket.tokens) / opts.refillPerMinute) * 60) };
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}

/** Best-effort client identity: first x-forwarded-for hop, else a shared local key. */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "").trim() || "local";
}
