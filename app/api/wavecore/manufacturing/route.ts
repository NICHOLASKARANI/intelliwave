export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const [woCount, bomCount, qcCount, wcCount, mrCount, activeWO, completedWO, passedQC] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM "WorkOrder" WHERE "organizationId" = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) FROM "BillOfMaterial" WHERE "organizationId" = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) FROM "QualityCheck" WHERE "organizationId" = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) FROM "WorkCenter" WHERE "organizationId" = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) FROM "MaintenanceRequest" WHERE "organizationId" = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) FROM "WorkOrder" WHERE "organizationId" = $1 AND status = 'IN_PROGRESS'`, [orgId]),
      pool.query(`SELECT COALESCE(SUM(quantity), 0) FROM "WorkOrder" WHERE "organizationId" = $1 AND status = 'COMPLETED'`, [orgId]),
      pool.query(`SELECT COUNT(*) FROM "QualityCheck" WHERE "organizationId" = $1 AND result = 'PASSED'`, [orgId]),
    ])

    const totalQC = parseInt(qcCount.rows[0].count)

    return NextResponse.json({
      stats: {
        activeWorkOrders: parseInt(activeWO.rows[0].count),
        productionOutput: parseInt(completedWO.rows[0].sum || '0'),
        qualityPassRate: totalQC > 0 ? Math.round((parseInt(passedQC.rows[0].count) / totalQC) * 100) : 0,
        efficiencyRate: 0,
        boms: parseInt(bomCount.rows[0].count),
        workCenters: parseInt(wcCount.rows[0].count),
        maintenanceRequests: parseInt(mrCount.rows[0].count),
        qualityChecks: totalQC,
        totalRoutes: 0,
      },
    })
  } catch (error: any) {
    console.error('Manufacturing stats error:', error.message)
    return NextResponse.json({ stats: {} }, { status: 500 })
  }
}