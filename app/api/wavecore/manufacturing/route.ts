export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

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

    const [workOrders, boms] = await Promise.all([
      pool.query('SELECT * FROM "WorkOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC', [orgId]),
      pool.query('SELECT * FROM "BillOfMaterial" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC', [orgId]),
    ])

    return NextResponse.json({
      stats: {
        activeWorkOrders: workOrders.rows.filter(w => w.status === 'IN_PROGRESS').length,
        productionOutput: workOrders.rows.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + w.quantity, 0),
        qualityPassRate: 0,
        efficiencyRate: 0,
        boms: boms.rows.length,
        workCenters: 0,
      },
      workOrders: workOrders.rows,
      boms: boms.rows,
    })
  } catch (error: any) {
    console.error('Manufacturing GET error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}