import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
  redisReady: boolean | undefined
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('[redis] REDIS_URL not set — cache disabled')
    return null
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
  })

  client.on('connect', () => {
    console.log('[redis] connected')
    globalForRedis.redisReady = true
  })

  client.on('ready', () => {
    console.log('[redis] ready')
    globalForRedis.redisReady = true
  })

  client.on('error', (err) => {
    console.warn('[redis] error:', err.message)
    globalForRedis.redisReady = false
  })

  client.on('end', () => {
    console.warn('[redis] connection ended')
    globalForRedis.redisReady = false
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
    const val = await redis.get(key)
    return val
  } catch (err) {
    console.warn('[redis] cacheGet failed:', (err as Error).message)
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, value, 'EX', ttlSeconds)
  } catch (err) {
    console.warn('[redis] cacheSet failed:', (err as Error).message)
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch (err) {
    console.warn('[redis] cacheDel failed:', (err as Error).message)
  }
}