// ============================================================
// WaveCore RBAC Guard
// Role-based access control for enterprise modules.
// Soft-launch mode: LOGS violations, does NOT block (48h).
// Toggle ENFORCE = true to turn on hard blocking.
// ============================================================

import { NextResponse } from 'next/server'
import { requireTenant, WaveCoreSession } from './auth'
import { pool } from './db'
import { guardRateLimit } from './rate-limit'
import { checkCsrf } from './csrf'

// ============ CONFIG ============
const ENFORCE = true // soft launch — flip to true after 48h of clean logs
// ================================

export type GuardAction =
  | 'HR_READ'         // list employees, attendance, leaves, departments, etc.
  | 'HR_WRITE'        // create/update non-sensitive records
  | 'HR_DELETE'       // delete records
  | 'HR_PII_READ'     // read sensitive PII (salary, ID, bank, KRA)
  | 'HR_PAYROLL'      // run payroll, view payslips
  | 'HR_EXPORT'       // generate PDFs / mass exports
  // ---- Procurement module ----
  | 'PROCUREMENT_READ'      // view suppliers, POs, requisitions, contracts, analytics
  | 'PROCUREMENT_WRITE'     // create/update procurement records
  | 'PROCUREMENT_APPROVE'   // approve requisitions, POs, RFQ awards
  | 'PROCUREMENT_DELETE'    // delete procurement records
  | 'PROCUREMENT_EXPORT'    // export procurement reports

const TIER: Record<string, number> = {
  OWNER: 4,
  TENANT_ADMIN: 3,
  HR_MANAGER: 2,
  HR_VIEWER: 1,
}

const REQUIRED_TIER: Record<GuardAction, number> = {
  HR_READ: 1,        // anyone authenticated with ≥1
  HR_WRITE: 2,       // HR_Manager+
  HR_DELETE: 4,      // OWNER only
  HR_PII_READ: 3,    // Tenant Admin+
  HR_PAYROLL: 4,     // OWNER only
  HR_EXPORT: 3,      // Tenant Admin+

  // ---- Procurement module (same tier model) ----
  PROCUREMENT_READ: 1,
  PROCUREMENT_WRITE: 2,
  PROCUREMENT_APPROVE: 3,
  PROCUREMENT_DELETE: 4,
  PROCUREMENT_EXPORT: 3,
}

export interface GuardResult {
  deny: boolean
  response?: NextResponse
  session?: WaveCoreSession
  tier: number
  requiredTier: number
}

/**
 * Guard an HR endpoint.
 *
 * Usage:
 *   const g = await guardHR(request, 'HR_WRITE')
 *   if (g.deny) return g.response
 *   const session = g.session!   // safe to use
 */
export async function guardModule(
  request: Request,
  action: GuardAction
): Promise<GuardResult> {
  return guardHR(request, action)
}

export async function guardHR(
  request: Request,
  action: GuardAction
): Promise<GuardResult> {
  const session = await requireTenant(request)

  if (!session) {
    return {
      deny: true,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      tier: 0,
      requiredTier: REQUIRED_TIER[action],
    }
  }

  // === WAVE 4: CSRF + RATE LIMIT ===
  const csrf = checkCsrf(request)
  if (!csrf.allow) return { deny: true, response: csrf.response!, session, tier: 0, requiredTier: 0 }

  const method = (request.method || 'GET').toUpperCase()
  const kind: 'mutation' | 'export' | 'read' =
    action === 'HR_EXPORT' ? 'export'
    : (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') ? 'mutation'
    : 'read'
  const rl = guardRateLimit(session.userId, kind)
  if (!rl.allow) return { deny: true, response: rl.response!, session, tier: 0, requiredTier: 0 }
  // ==================================

  // Org must be active
  if (!session.orgActive) {
    return {
      deny: true,
      response: NextResponse.json({ error: 'Organization inactive' }, { status: 403 }),
      session,
      tier: 0,
      requiredTier: REQUIRED_TIER[action],
    }
  }

  const userTier = TIER[session.role || ''] ?? 0
  const required = REQUIRED_TIER[action]
  const allowed = userTier >= required

  // ============ ALWAYS LOG (soft + hard) ============
  logGuardAttempt(session, action, allowed, userTier, required).catch(() => {})

  if (!allowed && ENFORCE) {
    return {
      deny: true,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          action,
          requiredTier: required,
          yourTier: userTier,
          hint: 'Contact your administrator if you believe this is an error.',
        },
        { status: 403 }
      ),
      session,
      tier: userTier,
      requiredTier: required,
    }
  }

  // Soft launch — allowed=false but still proceed
  return { deny: false, session, tier: userTier, requiredTier: required }
}

/**
 * Fire-and-forget audit log of guard attempts.
 * Never throws, never blocks the request.
 */
async function logGuardAttempt(
  session: WaveCoreSession,
  action: GuardAction,
  allowed: boolean,
  userTier: number,
  requiredTier: number
): Promise<void> {
  try {
    // Reuse existing AuditLog table
    await pool.query(
      `INSERT INTO "AuditLog"
         (id, action, "entityType", "entityId", changes, "userId", "organizationId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'RBAC_CHECK', $2, $3, $4, $5, NOW())`,
      [
        allowed ? 'RBAC_ALLOW' : 'RBAC_DENY',
        action,
        JSON.stringify({
          role: session.role,
          userTier,
          requiredTier,
          email: session.email,
          enforce: ENFORCE,
        }),
        session.userId,
        session.organizationId,
      ]
    )
  } catch (err) {
    // Silent — never break the request because logging failed
    console.error('[RBAC-LOG-FAIL]', (err as Error).message)
  }
}

/**
 * Utility — current enforce mode (for diagnostics endpoint)
 */
export function getEnforceMode(): boolean {
  return ENFORCE
}