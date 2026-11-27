export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

// GET /api/wavve-si/restaurant/reservations/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT r.*, t.name AS "tableName"
       FROM "Reservation" r
       LEFT JOIN "RestaurantTable" t ON t.id = r."tableId"
       WHERE r.id = $1 AND r."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ reservation: res.rows[0] })
  } catch (error: any) {
    console.error('[reservation GET]', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH — update status / details
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, customerName, customerPhone, customerEmail, partySize, reservationAt, durationMins, tableId, notes } = body || {}

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const sets: string[] = []
    const vals: any[] = []
    if (status)         { vals.push(status);         sets.push(`status = $${vals.length}`) }
    if (customerName !== undefined)   { vals.push(customerName);   sets.push(`"customerName" = $${vals.length}`) }
    if (customerPhone !== undefined)  { vals.push(customerPhone);  sets.push(`"customerPhone" = $${vals.length}`) }
    if (customerEmail !== undefined)  { vals.push(customerEmail);  sets.push(`"customerEmail" = $${vals.length}`) }
    if (partySize !== undefined)      { vals.push(partySize);      sets.push(`"partySize" = $${vals.length}`) }
    if (reservationAt !== undefined)  { vals.push(reservationAt);  sets.push(`"reservationAt" = $${vals.length}::timestamp`) }
    if (durationMins !== undefined)   { vals.push(durationMins);   sets.push(`"durationMins" = $${vals.length}`) }
    if (tableId !== undefined)        { vals.push(tableId);        sets.push(`"tableId" = $${vals.length}`) }
    if (notes !== undefined)          { vals.push(notes);          sets.push(`notes = $${vals.length}`) }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    sets.push(`"updatedAt" = NOW()`)
    vals.push(params.id); vals.push(session.organizationId)

    const res = await pool.query(
      `UPDATE "Reservation"
       SET ${sets.join(', ')}
       WHERE id = $${vals.length - 1} AND "organizationId" = $${vals.length}
       RETURNING *`,
      vals
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ reservation: res.rows[0] })
  } catch (error: any) {
    console.error('[reservation PATCH]', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `DELETE FROM "Reservation" WHERE id = $1 AND "organizationId" = $2 RETURNING id`,
      [params.id, session.organizationId]
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[reservation DELETE]', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}