/**
 * WaveCore Audit Helper — financial audit trail
 *
 * Two flavors:
 *   - writeAudit(client, ...)   inside a transaction -> commits/rolls back with the financial event
 *   - writeAuditAsync(...)      fire-and-forget, matches existing bank-payment/mpesa style
 *
 * Use writeAudit(client, ...) for ALL financial mutations (invoice, payment, journal, budget)
 * so audit entries are atomically committed with the financial record.
 */

import type { PoolClient } from 'pg'
import { pool } from '@/lib/wavecore/db'

export interface AuditInput {
  organizationId: string
  userId?: string | null
  action: string            // 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID' | 'APPROVE' | 'REJECT'
  entityType: string        // 'CustomerInvoice' | 'CustomerPayment' | 'JournalEntry' | 'Budget' | 'Customer' | 'Supplier' | 'FixedAsset'
  entityId: string
  changes?: Record<string, unknown> | null
  journalEntryId?: string | null
}

/**
 * Write audit entry inside a caller-owned transaction.
 * Throws if the insert fails — caller's transaction rolls back.
 */
export async function writeAudit(client: PoolClient, input: AuditInput): Promise<void> {
  await client.query(
    `INSERT INTO "AuditLog"
       (id, action, "entityType", "entityId", changes, "userId", "journalEntryId", "organizationId", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      input.action,
      input.entityType,
      input.entityId,
      input.changes ? JSON.stringify(input.changes) : null,
      input.userId || null,
      input.journalEntryId || null,
      input.organizationId,
    ]
  )
}

/**
 * Fire-and-forget audit — matches existing mpesa/bank-payment style.
 * Never throws, never blocks. Use for non-critical telemetry only.
 */
export async function writeAuditAsync(input: AuditInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO "AuditLog"
         (id, action, "entityType", "entityId", changes, "userId", "journalEntryId", "organizationId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        input.action,
        input.entityType,
        input.entityId,
        input.changes ? JSON.stringify(input.changes) : null,
        input.userId || null,
        input.journalEntryId || null,
        input.organizationId,
      ]
    )
  } catch {
    // swallow — audit failures must never break the request
  }
}