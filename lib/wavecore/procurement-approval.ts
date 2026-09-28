/**
 * WaveCore Procurement — Approval workflow helpers + chain resolver.
 *
 * MERGED FILE — contains BOTH:
 *   1. Legacy approval-step helpers (canActOnStep, summariseChain, ApprovalActor)
 *      — used by requisition and PO approve/reject/delegate routes.
 *   2. New chain-based resolver (resolveApprovalChain, planChainApprovals)
 *      — used by approval chain admin + future routing.
 *
 * Do not remove either half without checking callers.
 */

import { pool } from '@/lib/wavecore/db'

// ============================================================
// SECTION 1 — Legacy approval-step helpers (unchanged)
// ============================================================

/**
 * WaveCore Procurement ΓÇö Approval workflow helpers
 */

export interface ApprovalActor {
  userId: string
  userName: string
  role: string
}

/**
 * Is this actor allowed to act on the given approval step?
 * Rule:
 *   - If step.approverUserId is set ΓåÆ only that user
 *   - Else if step.approverRole matches actor.role (exact, case-insensitive) ΓåÆ allowed
 *   - Else if actor tier >= PROCUREMENT_APPROVE tier (3) ΓåÆ allowed (fallback for admins)
 */
export function canActOnStep(
  step: { approverUserId?: string | null; approverRole?: string | null; delegatedTo?: string | null },
  actor: ApprovalActor,
  actorTier: number
): { allowed: boolean; reason?: string } {
  // Explicit user assignment
  if (step.approverUserId) {
    if (step.approverUserId === actor.userId) return { allowed: true }
    // Delegation also grants rights
    if (step.delegatedTo && step.delegatedTo === actor.userId) return { allowed: true }
    return { allowed: false, reason: 'Step is assigned to a different user' }
  }

  // Role-based
  if (step.approverRole) {
    const want = String(step.approverRole).toUpperCase()
    const have = String(actor.role || '').toUpperCase()
    if (want === have) return { allowed: true }
    // Delegation override
    if (step.delegatedTo && step.delegatedTo === actor.userId) return { allowed: true }
    // Fallback: Tier 3+ (Tenant Admin, Owner) can override role mismatch
    if (actorTier >= 3) return { allowed: true }
    return { allowed: false, reason: 'Your role does not match the required approver role (' + want + ')' }
  }

  // No constraint ΓÇö anyone with the tier can approve
  if (actorTier >= 3) return { allowed: true }
  return { allowed: false, reason: 'Insufficient tier for approval' }
}

/**
 * Compute a summary of an approval chain.
 */
export function summariseChain(steps: any[]): {
  total: number
  approved: number
  rejected: number
  pending: number
  cancelled: number
  currentStep: number | null
  isComplete: boolean
  isRejected: boolean
} {
  const total = steps.length
  let approved = 0, rejected = 0, pending = 0, cancelled = 0
  let currentStep: number | null = null

  for (const s of steps) {
    if (s.status === 'APPROVED') approved++
    else if (s.status === 'REJECTED') rejected++
    else if (s.status === 'PENDING') {
      pending++
      if (currentStep === null || s.stepNumber < currentStep) currentStep = s.stepNumber
    }
    else if (s.status === 'CANCELLED') cancelled++
  }

  return {
    total, approved, rejected, pending, cancelled,
    currentStep,
    isComplete: total > 0 && approved + cancelled === total,
    isRejected: rejected > 0,
  }
}

// ============================================================
// SECTION 2 — New approval-chain resolver (added in Phase 8)
// ============================================================

export type DocumentType =
  | 'REQUISITION'
  | 'PURCHASE_ORDER'
  | 'SUPPLIER_INVOICE'
  | 'PAYMENT_RUN'
  | 'CONTRACT'

export interface ResolvedStep {
  id: string
  stepNumber: number
  name: string | null
  approverRole: string | null
  approverUserId: string | null
  approverUserName: string | null
  isRequired: boolean
  slaHours: number | null
  notes: string | null
}

export interface ResolvedChain {
  id: string
  name: string | null
  documentType: DocumentType
  minAmount: number | null
  maxAmount: number | null
  currency: string
  priority: number
  notes: string | null
  steps: ResolvedStep[]
}

/**
 * Picks the winning chain for (org, docType, amount).
 * Matching rules:
 *   - isActive = TRUE
 *   - documentType matches
 *   - amount >= COALESCE(minAmount, 0)
 *   - amount <= COALESCE(maxAmount, +inf)
 * Sort: priority DESC, minAmount ASC, createdAt ASC
 * Returns null if no chain matches.
 */
export async function resolveApprovalChain(
  organizationId: string,
  documentType: DocumentType,
  amount: number
): Promise<ResolvedChain | null> {
  const r = await pool.query(
    `SELECT * FROM "ApprovalChain"
     WHERE "organizationId" = $1
       AND "documentType" = $2
       AND "isActive" = TRUE
       AND $3::numeric >= COALESCE("minAmount", 0)
       AND ($3::numeric <= "maxAmount" OR "maxAmount" IS NULL)
     ORDER BY priority DESC, COALESCE("minAmount", 0) ASC, "createdAt" ASC
     LIMIT 1`,
    [organizationId, documentType, Number(amount) || 0]
  )
  if (r.rowCount === 0) return null
  const chain = r.rows[0]

  const stepsRes = await pool.query(
    `SELECT * FROM "ApprovalStep"
     WHERE "chainId" = $1 AND "organizationId" = $2
     ORDER BY "stepNumber" ASC`,
    [chain.id, organizationId]
  )

  return {
    id: chain.id,
    name: chain.name,
    documentType: chain.documentType,
    minAmount: chain.minAmount != null ? Number(chain.minAmount) : null,
    maxAmount: chain.maxAmount != null ? Number(chain.maxAmount) : null,
    currency: chain.currency || 'KES',
    priority: Number(chain.priority || 100),
    notes: chain.notes,
    steps: stepsRes.rows.map((s: any) => ({
      id: s.id,
      stepNumber: Number(s.stepNumber),
      name: s.name,
      approverRole: s.approverRole,
      approverUserId: s.approverUserId,
      approverUserName: s.approverUserName,
      isRequired: !!s.isRequired,
      slaHours: s.slaHours != null ? Number(s.slaHours) : null,
      notes: s.notes,
    })),
  }
}

/**
 * (Future 8-3) Creates one ProcurementApproval row per chain step.
 * Kept here as a stub so callers can already import it.
 */
export async function planChainApprovals(chain: ResolvedChain | null) {
  if (!chain || chain.steps.length === 0) return []
  return chain.steps.map(s => ({
    stepNumber: s.stepNumber,
    name: s.name,
    approverRole: s.approverRole,
    approverUserId: s.approverUserId,
    approverUserName: s.approverUserName,
    isRequired: s.isRequired,
    slaHours: s.slaHours,
    status: 'PENDING' as const,
  }))
}