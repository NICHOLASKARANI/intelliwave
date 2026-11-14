import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[redis] REDIS_URL not set — cache disabled')
    }
    return null
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) return null
      return Math.min(times * 200, 2000)
    },
  })

  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[redis] error:', err.message)
    }
  })

  return client
}

export const redis = globalForRedis.redis ?? createRedisClient() ?? undefined

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!redis) return null
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, value, 'EX', ttlSeconds)
  } catch {
    // ignore cache failures
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // ignore
  }
}