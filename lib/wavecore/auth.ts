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
    const sessionKey = session:
    const cached = getCache(sessionKey)
    if (cached) return cached
    
    const result = await pool.query(
      `SELECT s.id as session_id, s."userId", s.expires,
              u.name, u.email, u.role, u."isActive",
              o.id as org_id, o.name as org_name, o."isActive" as org_active
       FROM "Session" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "_OrganizationMembers" om ON om."B" = u.id
       JOIN "Organization" o ON o.id = om."A"
       WHERE s."sessionToken" = $1
       LIMIT 1`,
      [sessionToken]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]

    if (new Date(row.expires) < new Date()) {
      await pool.query('DELETE FROM "Session" WHERE "sessionToken" = $1', [sessionToken])
      return null
    }

    if (!row.isActive || !row.org_active) return null

    return {
      sessionId: row.session_id,
      userId: row.userId,
      organizationId: row.org_id,
      role: row.role || 'VIEWER',
      name: row.name || 'User',
      email: row.email,
      orgName: row.org_name,
      isActive: row.isActive,
      orgActive: row.org_active,
    }
  } catch (error) {
    console.error('Session lookup error:', error)
    return null
  }
}

export async function requireTenant(): Promise<WaveCoreSession> {
  const session = await getSession()
  if (!session) {
    redirect('/wavecore-erp/auth/login')
  }
  return session
}

export async function requireAuth(): Promise<WaveCoreSession> {
  return requireTenant()
}

export async function requireOrganization(): Promise<string> {
  const session = await requireTenant()
  return session.organizationId
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    await pool.query('DELETE FROM "Session" WHERE "sessionToken" = $1', [sessionToken])
  }

  cookieStore.delete(SESSION_COOKIE)
}

export function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    OWNER: ['*'],
    ADMIN: ['*'],
    MANAGER: ['finance.read','finance.write','crm.read','crm.write','inventory.read','inventory.write','hr.read','hr.write','projects.read','projects.write','analytics.read','manufacturing.read','manufacturing.write'],
    ACCOUNTANT: ['finance.read','finance.write','analytics.read'],
    SALES: ['crm.read','crm.write'],
    HR_MANAGER: ['hr.read','hr.write'],
    INVENTORY_MANAGER: ['inventory.read','inventory.write'],
    EMPLOYEE: ['hr.read','projects.read'],
    VIEWER: ['finance.read','crm.read','inventory.read','hr.read','projects.read','analytics.read'],
  }
  return permissions[role] || []
}

export function hasPermission(session: WaveCoreSession, permission: string): boolean {
  const permissions = getRolePermissions(session.role)
  if (permissions.includes('*')) return true
  return permissions.includes(permission)
}