import { kv } from '@vercel/kv'

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const raw = await kv.get<T>(key)
    if (raw === null || raw === undefined) {
      console.log('[cache] get', key, 'MISS')
      return null
    }
    console.log('[cache] get', key, 'HIT')
    return raw as T
  } catch (err) {
    console.error('[cache] get FAILED', key, (err as Error).message)
    return null
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
    console.log('[cache] set OK', key, 'ttl', ttlSeconds)
  } catch (err) {
    console.error('[cache] set FAILED', key, (err as Error).message)
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    const keys = await kv.keys(pattern)
    if (keys.length > 0) await kv.del(...keys)
    console.log('[cache] del', pattern, keys.length, 'keys')
  } catch (err) {
    console.error('[cache] del FAILED', pattern, (err as Error).message)
  }
}