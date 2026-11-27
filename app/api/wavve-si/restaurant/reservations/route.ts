export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET /api/wavve-si/restaurant/reservations
// Query: ?status=PENDING|CONFIRMED|SEATED|COMPLETED|CANCELLED|NO_SHOW
//        ?from=YYYY-MM-DD&to=YYYY-MM-DD
//        ?limit=50&offset=0
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const orgId = session.organizationId
    const status = sp.get('status')
    const from = sp.get('from')
    const to = sp.get('to')
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '50', 10)))
    const offset = Math.max(0, parseInt(sp.get('offset') || '0', 10))

    const where = ['"organizationId" = $1']
    const params: any[] = [orgId]
    if (status) { params.push(status); where.push(`status = $${params.length}`) }
    if (from)   { params.push(from);   where.push(`"reservationAt" >= $${params.length}::timestamp`) }
    if (to)     { params.push(to);     where.push(`"reservationAt" <= $${params.length}::timestamp`) }
    const whereSQL = where.join(' AND ')

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "Reservation" WHERE ${whereSQL}`,
      params
    )

    params.push(limit); params.push(offset)
    const rowsRes = await pool.query(
      `SELECT r.*, t.name AS "tableName"
       FROM "Reservation" r
       LEFT JOIN "RestaurantTable" t ON t.id = r."tableId"
       WHERE ${where.map(w => 'r.' + w.replace('"organizationId"', '"organizationId"').replace('status', '"status"').replace('"reservationAt"', '"reservationAt"')).join(' AND ')}
       ORDER BY r."reservationAt" DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return NextResponse.json({ reservations: rowsRes.rows, total: countRes.rows[0].total })
  } catch (error: any) {
    console.error('[reservations GET]', error?.message)
    return NextResponse.json({ error: 'Failed to load reservations' }, { status: 500 })
  }
}

// POST — create a reservation
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      customerId, customerName, customerPhone, customerEmail,
      partySize, reservationAt, durationMins, tableId, notes
    } = body || {}

    if (!customerName || !partySize || !reservationAt) {
      return NextResponse.json({ error: 'customerName, partySize, reservationAt required' }, { status: 400 })
    }

    const id = require('crypto').randomUUID()
    const res = await pool.query(
      `INSERT INTO "Reservation"
       (id, "organizationId", "customerId", "customerName", "customerPhone", "customerEmail",
        "partySize", "reservationAt", "durationMins", "tableId", status, notes, "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamp, $9, $10, 'PENDING', $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        id, session.organizationId, customerId || null, customerName, customerPhone || null, customerEmail || null,
        partySize, reservationAt, durationMins || 90, tableId || null, notes || null, session.userId
      ]
    )

    return NextResponse.json({ reservation: res.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[reservations POST]', error?.message)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}