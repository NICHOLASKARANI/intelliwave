import { cookies } from 'next/headers'
import { pool } from './db'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'wavecore_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export interface SessionData {
  userId: string
  organizationId: string
  role: string
  permissions: string[]
  name: string
  email: string
  orgName: string
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionToken) return null

  const result = await pool.query(
    `SELECT s."userId", s.expires, u.name, u.email, u.role, u."isActive",
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
  if (new Date(row.expires) < new Date() || !row.isActive || !row.org_active) {
    await pool.query('DELETE FROM "Session" WHERE "sessionToken" = $1', [sessionToken])
    return null
  }

  const permissions = getRolePermissions(row.role)

  return {
    userId: row.userId,
    organizationId: row.org_id,
    role: row.role,
    permissions,
    name: row.name || 'User',
    email: row.email,
    orgName: row.org_name,
  }
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session) {
    redirect('/wavecore-erp/auth/login')
  }
  return session
}

export async function requireOrganization(): Promise<string> {
  const session = await requireAuth()
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

function getRolePermissions(role: string): string[] {
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

export function hasPermission(session: SessionData, permission: string): boolean {
  if (session.permissions.includes('*')) return true
  return session.permissions.includes(permission)
}