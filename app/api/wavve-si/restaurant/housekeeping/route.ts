export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const orgId = session.organizationId
    const status = sp.get('status')
    const priority = sp.get('priority')
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '100', 10)))
    const offset = Math.max(0, parseInt(sp.get('offset') || '0', 10))

    const where = ['"organizationId" = $1']
    const params: any[] = [orgId]
    if (status)   { params.push(status);   where.push(`status = $${params.length}`) }
    if (priority) { params.push(priority); where.push(`priority = $${params.length}`) }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "HousekeepingTask" WHERE ${where.join(' AND ')}`, params)
    params.push(limit); params.push(offset)
    const rowsRes = await pool.query(
      `SELECT * FROM "HousekeepingTask" WHERE ${where.join(' AND ')}
       ORDER BY COALESCE("scheduledFor", "createdAt") DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params)

    return NextResponse.json({ tasks: rowsRes.rows, total: countRes.rows[0].total })
  } catch (error: any) {
    console.error('[hk GET]', error?.message)
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { roomNumber, roomType, taskType, priority, assignedToId, assignedToName, notes, scheduledFor } = body || {}

    if (!roomNumber || !taskType) {
      return NextResponse.json({ error: 'roomNumber and taskType required' }, { status: 400 })
    }

    const id = require('crypto').randomUUID()
    const res = await pool.query(
      `INSERT INTO "HousekeepingTask"
       (id, "organizationId", "roomNumber", "roomType", "taskType", priority, status,
        "assignedToId", "assignedToName", notes, "scheduledFor", "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10::timestamp, $11, NOW(), NOW())
       RETURNING *`,
      [id, session.organizationId, roomNumber, roomType || null, taskType, priority || 'NORMAL',
       assignedToId || null, assignedToName || null, notes || null, scheduledFor || null, session.userId]
    )

    return NextResponse.json({ task: res.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[hk POST]', error?.message)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}