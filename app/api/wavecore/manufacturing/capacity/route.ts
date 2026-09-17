export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const horizon = Math.min(Math.max(Number(searchParams.get('horizon') || 14), 7), 60)

    // Work centers
    const wcRes = await pool.query(
      `SELECT id, name, code, capacity, efficiency, "costPerHour" FROM "WorkCenter" WHERE "organizationId" = $1 ORDER BY name ASC`,
      [session.organizationId]
    )

    // Open WOs
    const woRes = await pool.query(
      `SELECT id, number, "productId", "workCenterId", status, quantity, "completedQty",
              priority, "startDate", "endDate"
       FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [session.organizationId]
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build the date axis
    const dates: Date[] = []
    for (let i = 0; i < horizon; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }

    // For each work center, compute daily load
    const workCenters = wcRes.rows.map(wc => {
      const capacityPerDay = Number(wc.capacity || 0) * (Number(wc.efficiency) || 1)

      // WOs assigned to this WC
      const assignedWOs = woRes.rows.filter(w =>
        w.workCenterId === wc.id || w.workCenterId === wc.name || w.workCenterId === wc.code
      )

      // Queue: remaining qty of all open WOs
      const queue = assignedWOs.reduce((s, w) => s + Math.max(0, Number(w.quantity) - Number(w.completedQty || 0)), 0)

      // Daily load: distribute each WO's remaining qty over its date range
      const daily: { date: string; load: number; capacity: number; pct: number }[] = []
      for (const d of dates) {
        let dayLoad = 0
        for (const w of assignedWOs) {
          const remaining = Math.max(0, Number(w.quantity) - Number(w.completedQty || 0))
          if (remaining === 0) continue
          const start = w.startDate ? new Date(w.startDate) : today
          const end = w.endDate ? new Date(w.endDate) : (() => { const e = new Date(start); e.setDate(e.getDate() + 7); return e })()
          start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999)
          if (d < start || d > end) continue
          const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          dayLoad += remaining / totalDays
        }
        const pct = capacityPerDay > 0 ? Math.round((dayLoad / capacityPerDay) * 100) : 0
        daily.push({
          date: d.toISOString().slice(0, 10),
          load: Math.round(dayLoad * 10) / 10,
          capacity: Math.round(capacityPerDay * 10) / 10,
          pct,
        })
      }

      const totalLoad = daily.reduce((s, d) => s + d.load, 0)
      const totalCapacity = daily.reduce((s, d) => s + d.capacity, 0)
      const utilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0
      const peakPct = daily.length > 0 ? Math.max(...daily.map(d => d.pct)) : 0
      const avgPct = daily.length > 0 ? Math.round(daily.reduce((s, d) => s + d.pct, 0) / daily.length) : 0

      let status = 'OK'
      if (capacityPerDay === 0) status = 'NO_CAPACITY'
      else if (peakPct > 100) status = 'OVERLOADED'
      else if (peakPct >= 70) status = 'HIGH'
      else if (utilization === 0) status = 'IDLE'
      else if (utilization < 30) status = 'UNDERUTILIZED'

      return {
        id: wc.id,
        name: wc.name,
        code: wc.code,
        capacity: Number(wc.capacity || 0),
        efficiency: Number(wc.efficiency || 0),
        capacityPerDay: Math.round(capacityPerDay * 10) / 10,
        queue,
        woCount: assignedWOs.length,
        totalLoad: Math.round(totalLoad * 10) / 10,
        totalCapacity: Math.round(totalCapacity * 10) / 10,
        utilization,
        peakPct,
        avgPct,
        status,
        daily,
        assignedWOs: assignedWOs.map(w => ({
          number: w.number,
          product: w.productId,
          status: w.status,
          priority: w.priority,
          quantity: Number(w.quantity),
          remaining: Math.max(0, Number(w.quantity) - Number(w.completedQty || 0)),
          dueDate: w.endDate,
        })),
      }
    })

    const totalCapacity = workCenters.reduce((s, w) => s + w.totalCapacity, 0)
    const totalLoad = workCenters.reduce((s, w) => s + w.totalLoad, 0)
    const overallUtilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0
    const overloaded = workCenters.filter(w => w.status === 'OVERLOADED').length
    const high = workCenters.filter(w => w.status === 'HIGH').length
    const underutilized = workCenters.filter(w => w.status === 'UNDERUTILIZED' || w.status === 'IDLE').length
    const bottleneck = workCenters.slice().sort((a, b) => b.peakPct - a.peakPct)[0] || null
    const availableHours = Math.round((totalCapacity - totalLoad) * 10) / 10

    const summary = {
      totalWorkCenters: workCenters.length,
      totalCapacity: Math.round(totalCapacity),
      totalLoad: Math.round(totalLoad),
      overallUtilization,
      overloaded,
      high,
      underutilized,
      idle: workCenters.filter(w => w.status === 'IDLE').length,
      bottleneck: bottleneck?.name || '—',
      bottleneckPct: bottleneck?.peakPct || 0,
      availableHours: Math.max(0, availableHours),
      horizon,
      dateRange: {
        start: dates[0].toISOString().slice(0, 10),
        end: dates[dates.length - 1].toISOString().slice(0, 10),
      },
    }

    return NextResponse.json({ workCenters, summary, dates: dates.map(d => d.toISOString().slice(0, 10)) })
  } catch (error) {
    console.error('Capacity GET error:', error)
    return NextResponse.json({ workCenters: [], summary: {}, dates: [], error: (error as Error).message })
  }
}