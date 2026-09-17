export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Work centers for capacity lookup
    const wcRes = await pool.query(
      `SELECT id, name, code, capacity, efficiency, "costPerHour" FROM "WorkCenter" WHERE "organizationId" = $1`,
      [session.organizationId]
    )
    const wcMap: Record<string, any> = {}
    for (const wc of wcRes.rows) {
      wcMap[wc.id] = wc
      wcMap[wc.name] = wc
      if (wc.code) wcMap[wc.code] = wc
    }

    // All WOs
    const woRes = await pool.query(
      `SELECT id, number, "productId", "workCenterId", status, quantity, "completedQty",
              priority, "startDate", "endDate", notes, "createdAt", "updatedAt"
       FROM "WorkOrder"
       WHERE "organizationId" = $1
       ORDER BY priority DESC, "createdAt" DESC
       LIMIT 500`,
      [session.organizationId]
    )
    const allWOs = woRes.rows

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const enrich = (wo: any) => {
      const wc = wcMap[wo.workCenterId] || null
      const capacity = Number(wc?.capacity || 0)
      const efficiency = Number(wc?.efficiency || 1)
      const remaining = Math.max(0, Number(wo.quantity) - Number(wo.completedQty || 0))
      const pct = Number(wo.quantity) > 0 ? Math.round((Number(wo.completedQty || 0) / Number(wo.quantity)) * 100) : 0
      const dailyThroughput = capacity > 0 ? capacity * (efficiency > 0 ? efficiency : 1) : 0
      const estimatedDays = dailyThroughput > 0 ? Math.max(1, Math.ceil(remaining / dailyThroughput)) : 1
      const overdue = wo.endDate && new Date(wo.endDate) < now && wo.status !== 'COMPLETED'
      return {
        id: wo.id,
        number: wo.number,
        product: wo.productId,
        workCenter: wo.workCenterId,
        workCenterName: wc?.name || wo.workCenterId || 'Unassigned',
        status: wo.status,
        priority: wo.priority,
        quantity: Number(wo.quantity),
        completedQty: Number(wo.completedQty || 0),
        remaining,
        pct,
        estimatedDays,
        startDate: wo.startDate,
        endDate: wo.endDate,
        dueDate: wo.endDate,
        notes: wo.notes,
        createdAt: wo.createdAt,
        updatedAt: wo.updatedAt,
        overdue,
      }
    }

    const running = allWOs.filter(w => w.status === 'IN_PROGRESS').map(enrich)
    const queued = allWOs.filter(w => w.status === 'DRAFT' || w.status === 'RELEASED').map(enrich)
    const completedToday = allWOs
      .filter(w => w.status === 'COMPLETED' && w.updatedAt && new Date(w.updatedAt) >= todayStart)
      .map(enrich)

    // Work center live state
    const workCenters = wcRes.rows.map(wc => {
      const activeWO = running.find(w => w.workCenter === wc.id || w.workCenter === wc.name)
      const queuedCount = queued.filter(w => w.workCenter === wc.id || w.workCenter === wc.name).length
      const openQty = [...running, ...queued]
        .filter(w => w.workCenter === wc.id || w.workCenter === wc.name)
        .reduce((s, w) => s + w.remaining, 0)
      const util = Number(wc.capacity) > 0 ? Math.min(999, Math.round((openQty / Number(wc.capacity)) * 100)) : 0
      return {
        id: wc.id,
        name: wc.name,
        code: wc.code,
        capacity: Number(wc.capacity),
        efficiency: Number(wc.efficiency),
        activeWO: activeWO ? { number: activeWO.number, product: activeWO.product, pct: activeWO.pct } : null,
        queuedCount,
        openQty,
        utilization: util,
        status: activeWO ? 'RUNNING' : (queuedCount > 0 ? 'QUEUED' : 'IDLE'),
      }
    })

    // Recent activity: last 15 WOs by updatedAt
    const recentActivity = [...allWOs]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 15)
      .map(w => ({
        number: w.number,
        product: w.productId,
        status: w.status,
        updatedAt: w.updatedAt || w.createdAt,
        workCenter: w.workCenterId,
      }))

    const completedTotal = allWOs.filter(w => w.status === 'COMPLETED').length
    const totalQty = allWOs.reduce((s, w) => s + Number(w.quantity || 0), 0)
    const completedQty = allWOs.reduce((s, w) => s + Number(w.completedQty || 0), 0)
    const onTimeCompleted = allWOs
      .filter(w => w.status === 'COMPLETED')
      .filter(w => !w.endDate || new Date(w.updatedAt) <= new Date(w.endDate)).length
    const onTimePct = completedTotal > 0 ? Math.round((onTimeCompleted / completedTotal) * 100) : 100
    const throughput = completedQty // units completed total

    const summary = {
      total: allWOs.length,
      running: running.length,
      queued: queued.length,
      completedToday: completedToday.length,
      completedTotal,
      overdue: allWOs.filter(w => w.status !== 'COMPLETED' && w.endDate && new Date(w.endDate) < now).length,
      throughput,
      onTimePct,
      workCentersActive: workCenters.filter(w => w.status === 'RUNNING').length,
      workCentersIdle: workCenters.filter(w => w.status === 'IDLE').length,
    }

    return NextResponse.json({ running, queued, completedToday, workCenters, recentActivity, summary })
  } catch (error) {
    console.error('Shop Floor GET error:', error)
    return NextResponse.json({ running: [], queued: [], completedToday: [], workCenters: [], recentActivity: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, action } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

    let patch: Record<string, any> = {}

    if (action === 'start') {
      patch = { status: 'IN_PROGRESS', startDate: new Date().toISOString() }
    } else if (action === 'complete') {
      const wo = await pool.query(`SELECT quantity FROM "WorkOrder" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
      if (wo.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      patch = { status: 'COMPLETED', completedQty: Number(wo.rows[0].quantity || 0), endDate: new Date().toISOString() }
    } else if (action === 'pause') {
      patch = { status: 'RELEASED' }
    } else if (action === 'reset') {
      patch = { status: 'DRAFT', completedQty: 0 }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const [k, v] of Object.entries(patch)) {
      sets.push(`"${k}" = $${i++}`)
      values.push(v)
    }
    sets.push(`"updatedAt" = NOW()`)
    values.push(id, session.organizationId)

    const result = await pool.query(
      `UPDATE "WorkOrder" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ workOrder: result.rows[0], action })
  } catch (error) {
    console.error('Shop Floor POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}