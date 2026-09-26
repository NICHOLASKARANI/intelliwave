/**
 * WaveCore Procurement — Approval workflow helpers
 */

export interface ApprovalActor {
  userId: string
  userName: string
  role: string
}

/**
 * Is this actor allowed to act on the given approval step?
 * Rule:
 *   - If step.approverUserId is set → only that user
 *   - Else if step.approverRole matches actor.role (exact, case-insensitive) → allowed
 *   - Else if actor tier >= PROCUREMENT_APPROVE tier (3) → allowed (fallback for admins)
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

  // No constraint — anyone with the tier can approve
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