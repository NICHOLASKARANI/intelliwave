export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/contracts/auto-expire
 *
 * Scans ACTIVE contracts whose endDate < NOW() and flips them to EXPIRED.
 * Idempotent. Tenant-scoped. Safe to call from Vercel Cron or manually.
 *
 * Returns: { scanned, expired, contracts: [{ id, contractNumber, title }] }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  const candidates = await pool.query(
    `SELECT id, "contractNumber", title
     FROM "SupplierContract"
     WHERE "organizationId" = $1
       AND status = 'ACTIVE'
       AND "endDate" IS NOT NULL
       AND "endDate" < NOW()`,
    [g.organizationId]
  )

  const expired: any[] = []
  for (const c of candidates.rows) {
    await pool.query(
      `UPDATE "SupplierContract"
       SET status = 'EXPIRED', "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [c.id, g.organizationId]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'SUPPLIER_CONTRACT_EXPIRED',
      entityType: 'SupplierContract',
      entityId: c.id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Auto-expired ' + c.contractNumber,
      metadata: { contractNumber: c.contractNumber, reason: 'endDate passed' },
    })

    expired.push({ id: c.id, contractNumber: c.contractNumber, title: c.title })
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.rowCount,
    expired: expired.length,
    contracts: expired,
  })
})

/**
 * GET also runs the scan (convenience for Vercel Cron if it can only hit GET).
 */
export const GET = POST