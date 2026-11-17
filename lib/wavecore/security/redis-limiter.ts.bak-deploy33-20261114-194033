// Redis Rate Limiter - Upstash Redis for serverless
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || ''

const redis = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  retryStrategy: (times) => Math.min(times * 100, 3000),
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

export async function checkRedisRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`

  try {
    const count = await redis.incr(windowKey)
    
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds)
    }

    if (count > maxRequests) {
      const ttl = await redis.ttl(windowKey)
      return { allowed: false, remaining: 0, retryAfter: Math.max(ttl, 1) }
    }

    return { allowed: true, remaining: maxRequests - count, retryAfter: 0 }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Fail open for now to not block users if Redis is down
    return { allowed: true, remaining: maxRequests, retryAfter: 0 }
  }
}

export default redis