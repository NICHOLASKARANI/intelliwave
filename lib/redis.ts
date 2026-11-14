import { kv } from '@vercel/kv'

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const raw = await kv.get(key)
    console.log('[cache] get', key, raw ? 'HIT' : 'MISS')
    return (raw as string | null) ?? null
  } catch (err) {
    console.error('[cache] get FAILED', key, (err as Error).message)
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
    console.log('[cache] set OK', key, value.length, 'bytes, ttl', ttlSeconds)
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