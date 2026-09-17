export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const safe = async (q: string, params: any[], fallback: any = { rows: [] }) => {
      try { return await pool.query(q, params) } catch { return fallback }
    }

    const [
      woRes, bomRes, wcRes, qcRes, rtRes, mrRes, srcRes
    ] = await Promise.all([
      safe(`SELECT id, number, status, quantity, "completedQty", priority, "endDate", "workCenterId", "updatedAt" FROM "WorkOrder" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, "isActive" FROM "BillOfMaterial" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, name, capacity, efficiency FROM "WorkCenter" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, result, "inspectedQty", "passedQty", "rejectedQty" FROM "QualityCheck" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id FROM "Routing" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, status, priority, "requestedDate" FROM "MaintenanceRequest" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
      safe(`SELECT id, quantity, "unitCost" FROM "ScrapRecord" WHERE "organizationId" = $1 LIMIT 500`, [orgId]),
    ])

    const workOrders = woRes.rows
    const boms = bomRes.rows
    const workCenters = wcRes.rows
    const qualityChecks = qcRes.rows
    const routings = rtRes.rows
    const maintenance = mrRes.rows
    const scrap = srcRes.rows

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const openWOs = workOrders.filter(w => w.status !== 'COMPLETED' && w.status !== 'CANCELLED')
    const runningWOs = workOrders.filter(w => w.status === 'IN_PROGRESS')
    const queuedWOs = workOrders.filter(w => w.status === 'DRAFT' || w.status === 'RELEASED')
    const completedWOs = workOrders.filter(w => w.status === 'COMPLETED')
    const completedToday = completedWOs.filter(w => w.updatedAt && new Date(w.updatedAt) >= todayStart)
    const overdueWOs = openWOs.filter(w => w.endDate && new Date(w.endDate) < now)

    const totalQty = workOrders.reduce((s, w) => s + Number(w.quantity || 0), 0)
    const totalCompletedQty = workOrders.reduce((s, w) => s + Number(w.completedQty || 0), 0)
    const efficiency = totalQty > 0 ? Math.round((totalCompletedQty / totalQty) * 100) : 100

    const passedQC = qualityChecks.filter(q => q.result === 'PASS').length
    const qualityRate = qualityChecks.length > 0 ? Math.round((passedQC / qualityChecks.length) * 100) : 100
    const totalInspected = qualityChecks.reduce((s, q) => s + Number(q.inspectedQty || 0), 0)
    const totalPassed = qualityChecks.reduce((s, q) => s + Number(q.passedQty || 0), 0)
    const totalRejected = qualityChecks.reduce((s, q) => s + Number(q.rejectedQty || 0), 0)

    const openMaintenance = maintenance.filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
    const overdueMaintenance = openMaintenance.filter(m => m.requestedDate && new Date(m.requestedDate) < now)

    const totalScrapQty = scrap.reduce((s, x) => s + Number(x.quantity || 0), 0)
    const totalScrapValue = scrap.reduce((s, x) => s + Number(x.quantity || 0) * Number(x.unitCost || 0), 0)

    // Capacity utilization: sum of running + queued remaining qty vs sum of WC capacities
    const totalCapacity = workCenters.reduce((s, wc) => s + Number(wc.capacity || 0), 0)
    const openQty = openWOs.reduce((s, w) => s + Math.max(0, Number(w.quantity) - Number(w.completedQty || 0)), 0)
    const utilization = totalCapacity > 0 ? Math.min(999, Math.round((openQty / totalCapacity) * 100)) : 0

    const summary = {
      // Work Orders
      totalWorkOrders: workOrders.length,
      openWorkOrders: openWOs.length,
      runningWorkOrders: runningWOs.length,
      queuedWorkOrders: queuedWOs.length,
      completedWorkOrders: completedWOs.length,
      completedToday: completedToday.length,
      overdueWorkOrders: overdueWOs.length,

      // Production
      output: totalCompletedQty,
      totalQty,
      efficiency: efficiency + '%',

      // Quality
      qualityChecks: qualityChecks.length,
      qualityRate: qualityRate + '%',
      totalInspected,
      totalPassed,
      totalRejected,

      // BOM
      boms: boms.length,
      activeBoms: boms.filter(b => b.isActive).length,

      // Work Centers
      workCenters: workCenters.length,
      avgEfficiency: workCenters.length > 0
        ? Math.round(workCenters.reduce((s, wc) => s + Number(wc.efficiency || 0), 0) / workCenters.length * 100) + '%'
        : '100%',

      // Routing
      routings: routings.length,

      // Maintenance
      maintenanceTotal: maintenance.length,
      openMaintenance: openMaintenance.length,
      overdueMaintenance: overdueMaintenance.length,

      // Scrap
      scrapRecords: scrap.length,
      totalScrapQty: Math.round(totalScrapQty * 10) / 10,
      totalScrapValue: Math.round(totalScrapValue),

      // Capacity
      utilization: utilization + '%',
      utilizationNum: utilization,
      totalCapacity,
      openQty,

      // Timestamp
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ workOrders, summary })
  } catch (error) {
    console.error('Manufacturing dashboard GET error:', error)
    return NextResponse.json({ workOrders: [], summary: {}, error: (error as Error).message })
  }
}