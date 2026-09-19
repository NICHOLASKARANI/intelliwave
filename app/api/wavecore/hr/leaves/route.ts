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
    const status = searchParams.get('status')
    const orgId = session.organizationId

    let sql = `SELECT l.*,
                 e."firstName", e."lastName", e."employeeId" AS "empCode", e.department,
                 lt.name AS "leaveTypeName", lt."isPaid"
               FROM "LeaveRequest" l
               LEFT JOIN "Employee" e ON e.id = l."employeeId" AND e."organizationId" = l."organizationId"
               LEFT JOIN "LeaveType" lt ON lt.id = l."leaveTypeId" AND lt."organizationId" = l."organizationId"
               WHERE l."organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (e."firstName" ILIKE $${idx} OR e."lastName" ILIKE $${idx} OR e."employeeId" ILIKE $${idx} OR l.reason ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (status && status !== 'ALL') {
      sql += ` AND l.status = $${idx++}`
      params.push(status)
    }

    sql += ` ORDER BY l."createdAt" DESC LIMIT 1000`

    const result = await pool.query(sql, params)

    const records = result.rows.map(r => ({
      ...r,
      employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
      days: Number(r.days || 0),
    }))

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const pending = records.filter(r => r.status === 'PENDING')
    const approved = records.filter(r => r.status === 'APPROVED')
    const rejected = records.filter(r => r.status === 'REJECTED')
    const thisMonth = records.filter(r => r.startDate && new Date(r.startDate) >= monthStart)

    const totalDaysThisYear = approved
      .filter(r => r.startDate && new Date(r.startDate).getFullYear() === now.getFullYear())
      .reduce((s, r) => s + Number(r.days || 0), 0)

    const pendingDays = pending.reduce((s, r) => s + Number(r.days || 0), 0)

    const summary = {
      total: records.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      pendingDays: Math.round(pendingDays * 10) / 10,
      totalDaysThisYear: Math.round(totalDaysThisYear * 10) / 10,
      thisMonthCount: thisMonth.length,
      avgDaysPerRequest: records.length > 0
        ? Math.round((records.reduce((s, r) => s + Number(r.days || 0), 0) / records.length) * 10) / 10
        : 0,
    }

    return NextResponse.json({ leaves: records, requests: records, summary })
  } catch (error) {
    console.error('Leaves GET error:', error)
    return NextResponse.json({ leaves: [], requests: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.employeeId) return NextResponse.json({ error: 'Employee is required' }, { status: 400 })
    if (!body.startDate) return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    if (!body.endDate) return NextResponse.json({ error: 'End date is required' }, { status: 400 })

    const start = new Date(body.startDate)
    const end = new Date(body.endDate)
    if (end < start) return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })

    const days = body.days ? Number(body.days) : Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    // Overlap detection
    const overlapRes = await pool.query(
      `SELECT id FROM "LeaveRequest"
       WHERE "organizationId" = $1 AND "employeeId" = $2 AND status IN ('PENDING','APPROVED')
         AND NOT ($4::timestamp < "startDate" OR $3::timestamp > "endDate")`,
      [session.organizationId, body.employeeId, body.startDate, body.endDate]
    )
    if (overlapRes.rows.length > 0) {
      return NextResponse.json({
        error: 'Overlapping leave request already exists for this employee'
      }, { status: 400 })
    }

    // Leave type: create or use default if none exists
    let leaveTypeId = body.leaveTypeId
    if (!leaveTypeId) {
      const ltRes = await pool.query(
        `SELECT id FROM "LeaveType" WHERE "organizationId" = $1 LIMIT 1`,
        [session.organizationId]
      )
      if (ltRes.rows.length > 0) {
        leaveTypeId = ltRes.rows[0].id
      } else {
        const crypto = require('crypto')
        const ltId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "LeaveType" (id, name, "isPaid", "organizationId", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,NOW(),NOW())`,
          [ltId, 'Annual Leave', true, session.organizationId]
        )
        leaveTypeId = ltId
      }
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "LeaveRequest"
        (id, "startDate", "endDate", days, reason, status, "employeeId", "leaveTypeId", "organizationId", "submittedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.startDate,
        body.endDate,
        days,
        body.reason || null,
        body.status || 'PENDING',
        body.employeeId,
        leaveTypeId,
        session.organizationId,
      ]
    )
    return NextResponse.json({ leave: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Leaves POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}