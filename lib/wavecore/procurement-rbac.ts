import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

/**
 * Procurement RBAC — drop-in role guard.
 *
 * Usage:
 *   const role = await assertProcurementRole(request, ['BUYER','ADMIN'])
 *   if (!role.ok) return role.response
 *
 * Behaviour:
 *   - If the org has ZERO active assignments, ALL requests are allowed
 *     (back-compat for orgs that haven't started using RBAC yet).
 *   - If the org has assignments, the current user must have an ACTIVE
 *     ProcurementUserRole with one of the allowedRoles.
 *   - ADMIN always passes.
 *
 * Assumes request has already passed assertProcurement (auth + org).
 */
export async function assertProcurementRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<
  | { ok: true; role: string | null; userId: string; userName: string | null }
  | { ok: false; response: NextResponse }
> {
  const userId = request.headers.get('x-user-id') || ''
  const userName = request.headers.get('x-user-name') || null
  const organizationId = request.headers.get('x-org-id') || ''

  if (!organizationId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Organization context required' }, { status: 403 }),
    }
  }

  // If RBAC not yet in use for this org, allow everything
  const has = await pool.query(
    `SELECT COUNT(*)::int AS n FROM "ProcurementUserRole"
     WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
    [organizationId]
  )
  if ((has.rows[0]?.n || 0) === 0) {
    return { ok: true, role: null, userId, userName }
  }

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User identity required for RBAC' }, { status: 403 }),
    }
  }

  const r = await pool.query(
    `SELECT role FROM "ProcurementUserRole"
     WHERE "organizationId" = $1 AND "userId" = $2 AND status = 'ACTIVE'`,
    [organizationId, userId]
  )
  const userRoles = r.rows.map((x: any) => String(x.role).toUpperCase())

  // ADMIN always passes
  if (userRoles.includes('ADMIN')) {
    return { ok: true, role: 'ADMIN', userId, userName }
  }

  const hit = userRoles.find(x => allowedRoles.map(a => a.toUpperCase()).includes(x))
  if (!hit) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden — requires one of: ${allowedRoles.join(', ')}` },
        { status: 403 }
      ),
    }
  }

  return { ok: true, role: hit, userId, userName }
}