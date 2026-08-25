// Redis Rate Limiter - Distributed for multi-instance deployment
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
})

export async function checkRedisRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`

  try {
    const count = await redis.incr(windowKey)
    
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds)
    }

    if (count > maxRequests) {
      const ttl = await redis.ttl(windowKey)
      return { allowed: false, remaining: 0, retryAfter: ttl }
    }

    return { allowed: true, remaining: maxRequests - count, retryAfter: 0 }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Fail open or closed? For security, fail closed on critical endpoints
    return { allowed: false, remaining: 0, retryAfter: 60 }
  }
}

export async function clearRedisRateLimit(key: string): Promise<void> {
  try {
    const keys = await redis.keys(`${key}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis clear error:', error)
  }
}

export default redis