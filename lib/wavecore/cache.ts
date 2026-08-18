// Simple in-memory cache
const cacheMap = new Map<string, { data: any; expiry: number }>()

export function getCache(key: string): any | null {
  const entry = cacheMap.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cacheMap.delete(key)
    return null
  }
  return entry.data
}

export function setCache(key: string, data: any, ttlSeconds: number = 60): void {
  cacheMap.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 })
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    cacheMap.clear()
    return
  }
  for (const key of cacheMap.keys()) {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key)
    }
  }
}