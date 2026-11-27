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
    const category = sp.get('category')
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '100', 10)))
    const offset = Math.max(0, parseInt(sp.get('offset') || '0', 10))

    const where = ['"organizationId" = $1']
    const params: any[] = [orgId]
    if (status)   { params.push(status);   where.push(`status = $${params.length}`) }
    if (category) { params.push(category); where.push(`category = $${params.length}`) }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "GuestServiceRequest" WHERE ${where.join(' AND ')}`, params)
    params.push(limit); params.push(offset)
    const rowsRes = await pool.query(
      `SELECT * FROM "GuestServiceRequest" WHERE ${where.join(' AND ')}
       ORDER BY "createdAt" DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params)

    return NextResponse.json({ requests: rowsRes.rows, total: countRes.rows[0].total })
  } catch (error: any) {
    console.error('[gsr GET]', error?.message)
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { roomNumber, guestName, guestPhone, guestEmail, category, priority, subject, description, assignedToId, assignedToName } = body || {}

    if (!guestName || !subject) {
      return NextResponse.json({ error: 'guestName and subject required' }, { status: 400 })
    }

    // Generate request number: GSR-YYYYMMDD-XXXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "GuestServiceRequest" WHERE "organizationId" = $1 AND "requestNumber" LIKE $2`,
      [session.organizationId, `GSR-${dateStr}-%`])
    const seq = String(countRes.rows[0].c + 1).padStart(4, '0')
    const requestNumber = `GSR-${dateStr}-${seq}`

    const id = require('crypto').randomUUID()
    const res = await pool.query(
      `INSERT INTO "GuestServiceRequest"
       (id, "organizationId", "requestNumber", "roomNumber", "guestName", "guestPhone", "guestEmail",
        category, priority, status, subject, description, "assignedToId", "assignedToName", "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [id, session.organizationId, requestNumber, roomNumber || null, guestName, guestPhone || null, guestEmail || null,
       category || 'OTHER', priority || 'NORMAL', subject, description || null,
       assignedToId || null, assignedToName || null, session.userId]
    )

    return NextResponse.json({ request: res.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[gsr POST]', error?.message)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}