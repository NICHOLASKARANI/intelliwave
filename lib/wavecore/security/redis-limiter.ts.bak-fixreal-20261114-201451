// DISABLED in Deploy 3.3 — was using ioredis with broken REDIS_URL
// Rate limiting falls back to in-memory. Re-enable when REDIS_URL is fixed.

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

const buckets = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
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