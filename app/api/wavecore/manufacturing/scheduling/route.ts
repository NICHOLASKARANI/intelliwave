export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const statusFilter = searchParams.get('status')

    // 1. Get all Work Centers (for capacity lookup)
    const wcRes = await pool.query(
      `SELECT id, name, code, capacity, efficiency, "costPerHour" FROM "WorkCenter" WHERE "organizationId" = $1`,
      [session.organizationId]
    )
    const workCenters = wcRes.rows
    const wcMap: Record<string, any> = {}
    for (const wc of workCenters) {
      wcMap[wc.id] = wc
      wcMap[wc.name] = wc
      if (wc.code) wcMap[wc.code] = wc
    }

    // 2. Get all open Work Orders
    let woSql = `SELECT id, number, "productId", "workCenterId", status, quantity, "completedQty",
                        priority, "startDate", "endDate", "createdAt"
                 FROM "WorkOrder"
                 WHERE "organizationId" = $1
                   AND status NOT IN ('COMPLETED', 'CANCELLED')`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (search) {
      woSql += ` AND (number ILIKE $${idx} OR "productId" ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (statusFilter && statusFilter !== 'ALL') {
      woSql += ` AND status = $${idx++}`
      params.push(statusFilter)
    }
    woSql += ` ORDER BY priority DESC, "endDate" ASC NULLS LAST, "createdAt" ASC`

    const woRes = await pool.query(woSql, params)
    const workOrders = woRes.rows

    // 3. Compute schedule for each WO
    const priorityRank: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    const scheduled = workOrders.map((wo, i) => {
      const wc = wcMap[wo.workCenterId] || null
      const capacity = Number(wc?.capacity || 0)
      const efficiency = Number(wc?.efficiency || 1)
      const remaining = Math.max(0, Number(wo.quantity) - Number(wo.completedQty || 0))

      // Estimated days: remaining / (capacity * efficiency)
      const dailyThroughput = capacity > 0 ? capacity * (efficiency > 0 ? efficiency : 1) : 0
      const estimatedDays = dailyThroughput > 0 ? Math.max(1, Math.ceil(remaining / dailyThroughput)) : 1

      // Start date: WO's own startDate, or today, plus offset for queue
      const startDate = wo.startDate ? new Date(wo.startDate) : new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + estimatedDays)

      // Status logic
      const today = new Date()
      let scheduleStatus = 'ON_TRACK'
      if (wo.endDate && endDate > new Date(wo.endDate)) scheduleStatus = 'AT_RISK'
      if (wo.endDate && today > new Date(wo.endDate) && wo.status !== 'COMPLETED') scheduleStatus = 'DELAYED'
      if (!wc) scheduleStatus = 'NO_WC'

      const loadPct = dailyThroughput > 0 ? Math.round((remaining / (dailyThroughput * estimatedDays)) * 100) : 0

      return {
        id: wo.id,
        number: wo.number,
        product: wo.productId,
        workCenter: wo.workCenterId,
        workCenterName: wc?.name || wo.workCenterId,
        status: wo.status,
        priority: wo.priority,
        quantity: Number(wo.quantity),
        completedQty: Number(wo.completedQty || 0),
        remaining,
        capacity,
        efficiency,
        estimatedDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dueDate: wo.endDate,
        loadPct,
        scheduleStatus,
        priorityRank: priorityRank[wo.priority] ?? 99,
        order: i,
      }
    })

    // 4. Per-work-center utilization
    const wcLoad: Record<string, { total: number; count: number; capacity: number }> = {}
    for (const s of scheduled) {
      const key = s.workCenterName || 'Unassigned'
      if (!wcLoad[key]) {
        const wc = wcMap[key] || wcMap[s.workCenter] || null
        wcLoad[key] = { total: 0, count: 0, capacity: Number(wc?.capacity || 0) }
      }
      wcLoad[key].total += s.remaining
      wcLoad[key].count += 1
    }

    const workCenterLoad = Object.entries(wcLoad).map(([name, v]) => ({
      name,
      count: v.count,
      totalQty: v.total,
      capacity: v.capacity,
      utilization: v.capacity > 0 ? Math.round((v.total / v.capacity) * 100) : 0,
    })).sort((a, b) => b.utilization - a.utilization)

    // 5. Summary
    const onTrack = scheduled.filter(s => s.scheduleStatus === 'ON_TRACK').length
    const atRisk = scheduled.filter(s => s.scheduleStatus === 'AT_RISK').length
    const delayed = scheduled.filter(s => s.scheduleStatus === 'DELAYED').length
    const noWc = scheduled.filter(s => s.scheduleStatus === 'NO_WC').length
    const totalDuration = scheduled.reduce((s, x) => s + x.estimatedDays, 0)
    const avgLoad = workCenterLoad.length > 0
      ? Math.round(workCenterLoad.reduce((s, w) => s + w.utilization, 0) / workCenterLoad.length)
      : 0
    const bottleneck = workCenterLoad[0] || null

    const summary = {
      total: scheduled.length,
      onTrack,
      atRisk,
      delayed,
      noWc,
      totalDuration,
      avgLoad,
      workCentersInUse: workCenterLoad.filter(w => w.count > 0).length,
      bottleneck: bottleneck?.name || '—',
    }

    return NextResponse.json({ scheduled, workCenterLoad, summary })
  } catch (error) {
    console.error('Scheduling GET error:', error)
    return NextResponse.json({ scheduled: [], workCenterLoad: [], summary: {}, error: (error as Error).message })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, workCenterName, startDate, endDate } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    if (workCenterName !== undefined) { sets.push(`"workCenterId" = $${i++}`); values.push(workCenterName) }
    if (startDate !== undefined) { sets.push(`"startDate" = $${i++}`); values.push(startDate || null) }
    if (endDate !== undefined) { sets.push(`"endDate" = $${i++}`); values.push(endDate || null) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(id, session.organizationId)

    const result = await pool.query(
      `UPDATE "WorkOrder" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ workOrder: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}