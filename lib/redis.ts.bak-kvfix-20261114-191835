// Cache layer using @vercel/kv (Upstash REST API, stateless HTTP).
// Why @vercel/kv instead of ioredis:
//  - Vercel serverless functions freeze between invocations
//  - ioredis keeps persistent TCP connections that get killed by the platform
//  - @vercel/kv uses stateless HTTP REST ? no connection to lose

import { kv } from '@vercel/kv'

// Environment can be either KV_REST_API_* or UPSTASH_REDIS_REST_*
// @vercel/kv auto-detects both conventions.

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const value = await kv.get<string>(key)
    return value ?? null
  } catch (err) {
    console.warn('[cache] get failed:', (err as Error).message)
    return null
  }
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
  } catch (err) {
    console.warn('[cache] set failed:', (err as Error).message)
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    const keys = await kv.keys(pattern)
    if (keys.length > 0) {
      await kv.del(...keys)
    }
  } catch (err) {
    console.warn('[cache] del failed:', (err as Error).message)
  }
}