export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth' from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const [wo, bom, qc, wc, mr] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM "WorkOrder"`),
      pool.query(`SELECT COUNT(*) FROM "BillOfMaterial"`),
      pool.query(`SELECT COUNT(*) FROM "QualityCheck"`),
      pool.query(`SELECT COUNT(*) FROM "WorkCenter"`),
      pool.query(`SELECT COUNT(*) FROM "MaintenanceRequest"`),
    ])

    const totalQC = parseInt(qc.rows[0].count)
    const passedQC = await pool.query(`SELECT COUNT(*) FROM "QualityCheck" WHERE "result" = 'PASSED'`)

    return NextResponse.json({
      stats: {
        activeWorkOrders: parseInt(wo.rows[0].count),
        productionOutput: 0,
        qualityPassRate: totalQC > 0 ? Math.round((parseInt(passedQC.rows[0].count) / totalQC) * 100) : 0,
        efficiencyRate: 0,
        boms: parseInt(bom.rows[0].count),
        workCenters: parseInt(wc.rows[0].count),
        maintenanceRequests: parseInt(mr.rows[0].count),
        qualityChecks: totalQC,
        totalRoutes: 0,
      },
    })
  } catch (error: any) {
    console.error('Dashboard:', error.message)
    return NextResponse.json({ stats: {} }, { status: 500 })
  }
}