// ============================================================
// WaveCore Rate Limiter
// In-memory sliding window per (userId, route-group).
// Soft-launch: LOGS violations, does NOT block (flip ENFORCE to true).
// For multi-region: swap the Map for Upstash Redis / Vercel KV later.
// ============================================================

import { NextResponse } from 'next/server'

// ============ CONFIG ============
const ENFORCE = false // soft launch — flip after observation

// Max mutations per window per user
const MAX_MUTATIONS_PER_MIN = 30
const WINDOW_MS = 60_000

// PII/export reads get a lower cap
const MAX_EXPORTS_PER_MIN = 10
// ================================

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) buckets.delete(k)
  }
}, 5 * 60_000).unref?.()

export interface RateLimitResult {
  allow: boolean
  response?: NextResponse
  count: number
  limit: number
  resetAt: number
}

/**
 * Check rate limit for a user + bucket key.
 * @param userId   - session.userId (or IP fallback)
 * @param key      - bucket key e.g. 'hr-mutation', 'hr-export'
 * @param limit    - max requests per window
 */
export function checkRateLimit(
  userId: string,
  key: string,
  limit = MAX_MUTATIONS_PER_MIN
): RateLimitResult {
  const bucketKey = `${userId}:${key}`
  const now = Date.now()
  let bucket = buckets.get(bucketKey)

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(bucketKey, bucket)
  }

  bucket.count += 1
  const allow = bucket.count <= limit

  if (!allow && ENFORCE) {
    return {
      allow: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          hint: `Rate limit is ${limit} requests per minute. Try again in ${Math.ceil((bucket.resetAt - now) / 1000)}s.`,
          retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)),
          },
        }
      ),
      count: bucket.count,
      limit,
      resetAt: bucket.resetAt,
    }
  }

  // Soft launch — always allow, but log when over limit
  if (!allow) {
    console.warn(`[RATE-LIMIT-SOFT] ${bucketKey} count=${bucket.count} limit=${limit}`)
  }

  return { allow: true, count: bucket.count, limit, resetAt: bucket.resetAt }
}

/**
 * Convenience wrapper for HR routes.
 */
export function guardRateLimit(
  userId: string,
  routeKind: 'mutation' | 'export' | 'read'
): RateLimitResult {
  const limits = {
    mutation: MAX_MUTATIONS_PER_MIN,
    export: MAX_EXPORTS_PER_MIN,
    read: 200,
  }
  return checkRateLimit(userId, `hr-${routeKind}`, limits[routeKind])
}

export function getRateLimitEnforce(): boolean {
  return ENFORCE
}