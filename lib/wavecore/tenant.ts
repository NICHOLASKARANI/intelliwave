import { getSession } from './auth'
import { prisma } from './prisma'

export interface TenantContext {
  userId: string
  organizationId: string
  role: string
  permissions: string[]
}

export async function getTenantContext(): Promise<TenantContext> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    role: session.role,
    permissions: session.permissions,
  }
}

export async function scopeQuery(where: any = {}): Promise<any> {
  const ctx = await getTenantContext()
  return {
    ...where,
    organizationId: ctx.organizationId,
  }
}

export async function verifyTenantAccess(
  organizationId: string
): Promise<void> {
  const session = await getSession()
  if (!session || session.organizationId !== organizationId) {
    throw new Error('Access denied')
  }
}

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
): Promise<void> {
  try {
    const ctx = await getTenantContext()
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId: ctx.userId,
        changes: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}