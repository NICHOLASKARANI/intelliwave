import { cookies } from 'next/headers'
import { getCache, setCache } from './cache'
import { pool } from './db'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'wavecore_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

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
}

export async function getSession(): Promise<WaveCoreSession | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionToken) return null

  try {
    const sessionKey = 'session:' + sessionToken
    const cached = getCache(sessionKey)
    if (cached) return cached as WaveCoreSession

    const result = await pool.query(
      `SELECT s.id as session_id, s."userId", s.expires,
              u.name, u.email, u.role, u."isActive",
              o.id as org_id, o.name as org_name, o."isActive" as org_active
       FROM "Session" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "Organization" o ON o.id = u."organizationId"
       WHERE s."sessionToken" = $1 AND s.expires > NOW()`,
      [sessionToken]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    const session: WaveCoreSession = {
      sessionId: row.session_id,
      userId: row.userId,
      organizationId: row.org_id,
      role: row.role,
      name: row.name,
      email: row.email,
      orgName: row.org_name,
      isActive: row.isActive,
      orgActive: row.org_active,
    }

    setCache(sessionKey, session, 60)

    return session
  } catch (error) {
    console.error('Session fetch error:', error)
    return null
  }
}

export async function requireTenant(): Promise<WaveCoreSession> {
  const session = await getSession()
  if (!session) {
    redirect('/wavecore-erp/auth/login')
  }
  if (!session.isActive || !session.orgActive) {
    redirect('/wavecore-erp/auth/login?error=inactive')
  }
  return session
}

export async function requireRole(allowedRoles: string[]): Promise<WaveCoreSession> {
  const session = await requireTenant()
  if (!allowedRoles.includes(session.role)) {
    redirect('/wavecore-erp?error=unauthorized')
  }
  return session
}

export async function createSession(userId: string, organizationId: string): Promise<string> {
  const crypto = require('crypto')
  const sessionId = crypto.randomUUID()
  
  await pool.query(
    `INSERT INTO "Session" (id, "userId", expires, "createdAt")
     VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
    [sessionId, userId]
  )
  
  return sessionId
}

export async function destroySession(sessionId: string): Promise<void> {
  await pool.query('DELETE FROM "Session" WHERE id = $1', [sessionId])
}