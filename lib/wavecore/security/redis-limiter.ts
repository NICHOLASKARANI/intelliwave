// In-memory rate limiter — ioredis disabled (broken REDIS_URL).
// Exports BOTH names so existing callers don't break.

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

const buckets = new Map<string, { count: number; resetAt: number }>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, b] of buckets.entries()) {
      if (now > b.resetAt) buckets.delete(k)
    }
  }, 60000)
}

function _check(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }
  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }
  bucket.count++
  return { allowed: true, remaining: maxRequests - bucket.count, resetAt: bucket.resetAt }
}

export async function checkRedisRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  return _check(key, maxRequests, windowMs)
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  return _check(key, maxRequests, windowMs)
}

export function checkRateLimitSync(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  return _check(key, maxRequests, windowMs)
}