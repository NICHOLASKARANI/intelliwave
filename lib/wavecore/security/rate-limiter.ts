// Rate Limiter - In-memory with Redis-ready structure
const buckets = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function rateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, retryAfter: 0 }
  }

  if (bucket.count >= config.maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  bucket.count++
  buckets.set(key, bucket)
  return { allowed: true, remaining: config.maxRequests - bucket.count, retryAfter: 0 }
}

export function clearRateLimit(key: string) {
  buckets.delete(key)
}

// Cleanup old buckets periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) {
      buckets.delete(key)
    }
  }
}, 60000)