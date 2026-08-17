export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    // Create all tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "WorkOrder" (
        "id" TEXT NOT NULL, "number" TEXT NOT NULL, "productName" TEXT NOT NULL,
        "quantity" INTEGER DEFAULT 1, "priority" TEXT DEFAULT 'MEDIUM', "status" TEXT DEFAULT 'DRAFT',
        "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "BillOfMaterial" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "productName" TEXT NOT NULL,
        "quantity" INTEGER DEFAULT 1, "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BillOfMaterial_pkey" PRIMARY KEY ("id")
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "QualityCheck" (
        "id" TEXT NOT NULL, "workOrder" TEXT NOT NULL, "result" TEXT DEFAULT 'PASSED',
        "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id")
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "WorkCenter" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "capacity" DOUBLE PRECISION DEFAULT 0,
        "efficiency" DOUBLE PRECISION DEFAULT 100, "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "MaintenanceRequest" (
        "id" TEXT NOT NULL, "assetName" TEXT NOT NULL, "description" TEXT,
        "priority" TEXT DEFAULT 'MEDIUM', "status" TEXT DEFAULT 'REQUESTED',
        "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
      )
    `)

    // Fetch all counts
    const [woCount, bomCount, qcCount, wcCount, mrCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "WorkOrder" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "BillOfMaterial" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "QualityCheck" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "WorkCenter" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "MaintenanceRequest" WHERE "organizationId" = $1', [orgId]),
    ])

    const activeWO = await pool.query('SELECT COUNT(*) FROM "WorkOrder" WHERE "organizationId" = $1 AND status = $2', [orgId, 'IN_PROGRESS'])
    const completedWO = await pool.query('SELECT COALESCE(SUM(quantity), 0) FROM "WorkOrder" WHERE "organizationId" = $1 AND status = $2', [orgId, 'COMPLETED'])
    const passedQC = await pool.query('SELECT COUNT(*) FROM "QualityCheck" WHERE "organizationId" = $1 AND result = $2', [orgId, 'PASSED'])

    const totalQC = parseInt(qcCount.rows[0].count)
    const totalWO = parseInt(woCount.rows[0].count)

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
    console.error('Manufacturing GET error:', error.message)
    return NextResponse.json({ stats: {} }, { status: 500 })
  }
}