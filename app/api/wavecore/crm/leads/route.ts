export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT l.*, c.name AS "convertedCustomerName"
       FROM "Lead" l
       LEFT JOIN "Customer" c ON c.id = l."customerId"
       WHERE l."organizationId" = $1
       ORDER BY l."createdAt" DESC
       LIMIT 200`,
      [session.organizationId]
    )
    return NextResponse.json({ leads: result.rows })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name, email, phone, company, source, status, priority, notes,
    } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO "Lead"
         (id, name, email, phone, company, source, status, priority, notes, score,
          "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, 0,
               $9, NOW(), NOW())
       RETURNING *`,
      [
        String(name).trim(),
        email || null,
        phone || null,
        company || null,
        source || null,
        status || 'NEW',
        priority || 'MEDIUM',
        notes || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ lead: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Lead" SET name = $1, email = $2, phone = $3, company = $4,
              source = $5, status = $6, priority = $7, notes = $8,
              "updatedAt" = NOW()
       WHERE id = $9 AND "organizationId" = $10
       RETURNING *`,
      [
        body.name, body.email || null, body.phone || null, body.company || null,
        body.source || null, body.status || 'NEW', body.priority || 'MEDIUM',
        body.notes || null, body.id, session.organizationId,
      ]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ lead: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await pool.query(
      `DELETE FROM "Lead" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}