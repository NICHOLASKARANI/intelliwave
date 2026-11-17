/**
 * WaveCore Finance — Approval evaluation helpers.
 *
 * Delegates to lib/wavecore/procurement-approval.ts (generic engine, despite the name)
 * to resolve the winning ApprovalChain rule for a given amount + document type.
 *
 * When approval is required, stores one FinanceApproval row — a NEW finance-only
 * table. Does NOT touch ProcurementApproval, so procurement behavior is 100%
 * preserved.
 *
 * Fail-open: on any error, defaults to NOT requiring approval (preserves
 * existing behavior for orgs without configured chains).
 */

import type { PoolClient } from 'pg'
import { resolveApprovalChain, type DocumentType } from '@/lib/wavecore/procurement-approval'

export type FinanceDocumentType = 'INVOICE' | 'JOURNAL_ENTRY' | 'PAYMENT' | 'CUSTOMER_CREDIT_NOTE' | 'SUPPLIER_CREDIT_NOTE'

export interface FinanceApprovalDecision {
  requiresApproval: boolean
  chainId: string | null
  chainName: string | null
  chainStepCount: number
}

/**
 * Ask the engine whether a given amount needs approval for this org + document type.
 * Never throws. Returns { requiresApproval: false } on any error.
 */
export async function evaluateFinanceApproval(
  organizationId: string,
  documentType: FinanceDocumentType,
  amount: number
): Promise<FinanceApprovalDecision> {
  try {
    const chain = await resolveApprovalChain(
      organizationId,
      documentType as DocumentType,
      Number(amount) || 0
    )
    if (!chain) {
      return { requiresApproval: false, chainId: null, chainName: null, chainStepCount: 0 }
    }
    return {
      requiresApproval: true,
      chainId: chain.id,
      chainName: chain.name,
      chainStepCount: chain.steps.length,
    }
  } catch (err) {
    console.error('[finance-approval evaluate]', err)
    return { requiresApproval: false, chainId: null, chainName: null, chainStepCount: 0 }
  }
}

/**
 * Store a FinanceApproval row linked to the entity. Must be called inside a
 * caller-owned transaction so the entity + approval commit/rollback together.
 *
 * Returns the new approval id. The caller should then set entity.approvalId
 * and entity.requiresApproval = true.
 */
export async function createFinanceApprovalRequest(
  client: PoolClient,
  args: {
    organizationId: string
    documentType: FinanceDocumentType
    entityId: string
    entityNumber: string | null
    amount: number
    userId: string
    userName: string
    chainId: string | null
  }
): Promise<{ approvalId: string }> {
  const crypto = require('crypto')
  const approvalId = crypto.randomUUID()

  await client.query(
    `INSERT INTO "FinanceApproval"
       (id, "organizationId", "documentType", "documentId", "documentNumber",
        amount, "chainId", status, "requestedBy", "requestedByName",
        "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, NOW(), NOW())`,
    [
      approvalId,
      args.organizationId,
      args.documentType,
      args.entityId,
      args.entityNumber,
      args.amount,
      args.chainId,
      args.userId,
      args.userName,
    ]
  )

  return { approvalId }
}