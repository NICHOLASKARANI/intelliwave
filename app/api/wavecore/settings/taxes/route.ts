export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, rate, type, active, createdat
       FROM "TaxRate"
       WHERE "organizationId" = $1
       ORDER BY createdat ASC`,
      [session.organizationId]
    )
    return NextResponse.json({ taxes: result.rows })
  } catch (error) {
    console.error('Taxes GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch taxes: ' + (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `INSERT INTO "TaxRate" (name, rate, type, active, createdat, "organizationId")
       VALUES ($1, $2, $3, true, NOW(), $4)
       RETURNING id, name, rate, type, active, createdat`,
      [body.name, parseFloat(body.rate) || 0, body.type || 'VAT', session.organizationId]
    )
    return NextResponse.json({ tax: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Taxes POST error:', error)
    return NextResponse.json({ error: 'Failed to create tax: ' + (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "TaxRate"
       SET name = $1, rate = $2, type = $3, active = $4
       WHERE id = $5 AND "organizationId" = $6
       RETURNING id, name, rate, type, active, createdat`,
      [body.name, parseFloat(body.rate), body.type, body.active, body.id, session.organizationId]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 })
    }
    return NextResponse.json({ tax: result.rows[0] })
  } catch (error) {
    console.error('Taxes PUT error:', error)
    return NextResponse.json({ error: 'Failed to update tax: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const result = await pool.query(
      `DELETE FROM "TaxRate" WHERE id = $1 AND "organizationId" = $2 RETURNING id`,
      [id, session.organizationId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Taxes DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete tax: ' + (error as Error).message }, { status: 500 })
  }
}