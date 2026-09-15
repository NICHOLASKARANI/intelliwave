export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    const [woRes, bomRes, wcRes, qcRes] = await Promise.all([
      pool.query(`SELECT * FROM "WorkOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`, [orgId]).catch(() => ({ rows: [] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM "BillOfMaterial" WHERE "organizationId" = $1`, [orgId]).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM "WorkCenter" WHERE "organizationId" = $1`, [orgId]).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM "QualityCheck" WHERE "organizationId" = $1`, [orgId]).catch(() => ({ rows: [{ c: 0 }] })),
    ])

    const wos = woRes.rows
    const active = wos.filter((w: any) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED')
    const completed = wos.filter((w: any) => w.status === 'COMPLETED')

    const output = wos.reduce((s: number, w: any) => s + Number(w.completedQty || 0), 0)
    const totalQty = wos.reduce((s: number, w: any) => s + Number(w.quantity || 0), 0)
    const efficiency = totalQty > 0 ? Math.round((output / totalQty) * 100) + '%' : '100%'

    return NextResponse.json({
      workOrders: wos,
      summary: {
        totalWorkOrders: wos.length,
        activeWorkOrders: active.length,
        completedWorkOrders: completed.length,
        output,
        efficiency,
        qualityRate: '100%',
        bomCount: bomRes.rows[0]?.c || 0,
        workCenterCount: wcRes.rows[0]?.c || 0,
        qualityCheckCount: qcRes.rows[0]?.c || 0,
      }
    })
  } catch (error) {
    console.error('Manufacturing GET error:', error)
    return NextResponse.json({ workOrders: [], summary: {} })
  }
}