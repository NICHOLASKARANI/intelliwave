import { pool } from './db'
import { getCache, setCache } from './cache'

const SESSION_COOKIE = 'wavecore_session'

export interface WaveCoreSession {
  sessionId: string
  userId: string
  organizationId: string
  role: string
  name: string
  email: string
  orgName: string
  isActive: boolean
  orgActive: boolean
  subscribed: boolean
}

// For API routes - pass sessionToken directly
export async function getSessionFromToken(sessionToken: string): Promise<WaveCoreSession | null> {
  if (!sessionToken) return null

  try {
    const sessionKey = 'session:' + sessionToken
    const cached = getCache(sessionKey)
    if (cached) return cached as WaveCoreSession

    const result = await pool.query(
      `SELECT s."userId", s.expires,
              u.name, u.email, u.role, u."isActive",
              o.id as org_id, o.name as org_name, o."isActive" as org_active
       FROM "Session" s
       JOIN "User" u ON u.id = s."userId"
       LEFT JOIN "Organization" o ON o."ownerId" = u.id
       WHERE s."sessionToken" = $1 AND s.expires > NOW()`,
      [sessionToken]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    
    // Check subscription
    let subscribed = false
    try {
      const subResult = await pool.query(
        `SELECT * FROM "Subscription" WHERE "organizationId" = $1 AND status = 'ACTIVE' AND "endDate" > NOW() LIMIT 1`,
        [row.org_id]
      )
      subscribed = subResult.rows.length > 0
    } catch {}

    const session: WaveCoreSession = {
      sessionId: sessionToken,
      userId: row.userId,
      organizationId: row.org_id,
      role: row.role,
      name: row.name,
      email: row.email,
      orgName: row.org_name,
      isActive: row.isActive,
      orgActive: row.org_active,
      subscribed,
    }

    setCache(sessionKey, session, 30)
    return session
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

// For server components - use cookies()
export async function getSession(): Promise<WaveCoreSession | null> {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
    return getSessionFromToken(sessionToken || '')
  } catch {
    return null
  }
}