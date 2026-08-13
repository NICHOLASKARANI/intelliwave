import { getSession, WaveCoreSession } from './auth'
import { pool } from './db'

export interface TenantContext {
  userId: string
  organizationId: string
  role: string
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
  }
}

export async function requireTenantContext(): Promise<TenantContext> {
  return getTenantContext()
}

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
): Promise<void> {
  try {
    const session = await getSession()
    if (!session) return

    await pool.query(
      `INSERT INTO "AuditLog" (id, action, "entityType", "entityId", "userId", changes, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
      [action, entityType, entityId, session.userId, metadata ? JSON.stringify(metadata) : null]
    )
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}