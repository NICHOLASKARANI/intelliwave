import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'wavecore_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface SessionData {
  userId: string
  organizationId: string
  role: string
  permissions: string[]
}

export async function createSession(userId: string, organizationId: string): Promise<string> {
  const crypto = await import('crypto')
  const sessionToken = crypto.randomBytes(64).toString('hex')
  
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires: new Date(Date.now() + SESSION_MAX_AGE),
    },
  })

  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE / 1000,
  })

  return sessionToken
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionToken) return null

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: {
          memberOrganizations: {
            include: {
              subscription: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expires < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    return null
  }

  const activeOrg = session.user.memberOrganizations[0]
  if (!activeOrg) return null

  const permissions = getRolePermissions(session.user.role)

  return {
    userId: session.userId,
    organizationId: activeOrg.id,
    role: session.user.role,
    permissions,
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
    await prisma.session.deleteMany({ where: { sessionToken } })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      members: { some: { id: userId } },
    },
  })
  return !!membership
}

function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    OWNER: ['*'],
    ADMIN: ['*'],
    MANAGER: [
      'finance.read', 'finance.create', 'finance.update',
      'crm.read', 'crm.create', 'crm.update',
      'inventory.read', 'inventory.create', 'inventory.update',
      'hr.read', 'hr.create', 'hr.update',
      'projects.read', 'projects.create', 'projects.update',
      'manufacturing.read', 'manufacturing.create', 'manufacturing.update',
      'analytics.read',
    ],
    ACCOUNTANT: [
      'finance.read', 'finance.create', 'finance.update',
      'analytics.read',
    ],
    SALES: [
      'crm.read', 'crm.create', 'crm.update',
    ],
    HR_MANAGER: [
      'hr.read', 'hr.create', 'hr.update',
    ],
    INVENTORY_MANAGER: [
      'inventory.read', 'inventory.create', 'inventory.update',
    ],
    EMPLOYEE: [
      'hr.read',
      'projects.read',
    ],
    VIEWER: [
      'finance.read', 'crm.read', 'inventory.read',
      'hr.read', 'projects.read', 'analytics.read',
    ],
  }

  return permissions[role] || []
}

export function hasPermission(session: SessionData, permission: string): boolean {
  if (session.permissions.includes('*')) return true
  return session.permissions.includes(permission)
}