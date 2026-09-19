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
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const orgId = session.organizationId

    let sql = `SELECT a.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department
               FROM "Attendance" a
               LEFT JOIN "Employee" e ON e.id = a."employeeId" AND e."organizationId" = a."organizationId"
               WHERE a."organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (e."firstName" ILIKE $${idx} OR e."lastName" ILIKE $${idx} OR e."employeeId" ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (status && status !== 'ALL') {
      sql += ` AND a.status = $${idx++}`
      params.push(status)
    }
    if (from) { sql += ` AND a.date >= $${idx++}`; params.push(from) }
    if (to)   { sql += ` AND a.date <= $${idx++}`; params.push(to) }

    sql += ` ORDER BY a.date DESC LIMIT 2000`

    const result = await pool.query(sql, params)

    // Compute hours worked for each record
    const records = result.rows.map(r => {
      let hours = 0
      if (r.checkIn && r.checkOut) {
        hours = (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60)
        if (hours < 0) hours = 0
      }
      return {
        ...r,
        hoursWorked: Math.round(hours * 10) / 10,
        employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
      }
    })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const totalRecords = records.length
    const todayRecords = records.filter(r => r.date && new Date(r.date) >= todayStart)
    const presentToday = todayRecords.filter(r => r.status === 'PRESENT').length
    const absentToday = todayRecords.filter(r => r.status === 'ABSENT').length
    const lateToday = todayRecords.filter(r => r.status === 'LATE').length
    const leaveToday = todayRecords.filter(r => r.status === 'LEAVE').length

    // Employee count for attendance rate
    const empCount = await pool.query(
      `SELECT COUNT(*) AS cnt FROM "Employee" WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [orgId]
    )
    const activeEmployees = Number(empCount.rows[0]?.cnt || 0)
    const attendanceRate = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0

    // Total hours this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthRecords = records.filter(r => r.date && new Date(r.date) >= monthStart)
    const totalHoursThisMonth = Math.round(monthRecords.reduce((s, r) => s + r.hoursWorked, 0) * 10) / 10
    const avgHoursPerDay = monthRecords.length > 0
      ? Math.round((totalHoursThisMonth / monthRecords.filter(r => r.hoursWorked > 0).length) * 10) / 10
      : 0

    // Late rate
    const lateThisMonth = monthRecords.filter(r => r.status === 'LATE').length
    const lateRate = monthRecords.length > 0
      ? Math.round((lateThisMonth / monthRecords.length) * 100)
      : 0

    const summary = {
      totalRecords,
      presentToday,
      absentToday,
      lateToday,
      leaveToday,
      attendanceRate,
      activeEmployees,
      totalHoursThisMonth: Math.round(totalHoursThisMonth),
      avgHoursPerDay,
      lateRate,
    }

    return NextResponse.json({ attendance: records, summary })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ attendance: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.employeeId) return NextResponse.json({ error: 'Employee is required' }, { status: 400 })
    if (!body.date) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Attendance"
        (id, date, "checkIn", "checkOut", status, notes, "employeeId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.date,
        body.checkIn || null,
        body.checkOut || null,
        body.status || 'PRESENT',
        body.notes || null,
        body.employeeId,
        session.organizationId,
      ]
    )
    return NextResponse.json({ attendance: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}