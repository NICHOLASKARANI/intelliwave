export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const VALID_STATUSES = ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING']

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, capacity, location, status, "createdAt"
       FROM "RestaurantTable"
       WHERE "organizationId" = $1
       ORDER BY name ASC`,
      [session.organizationId]
    )

    return NextResponse.json({ tables: result.rows })
  } catch (err: any) {
    console.error('[tables] GET error:', err?.message)
    return NextResponse.json({ error: 'Failed to load tables' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, capacity = 4, location } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
    }

    // Check uniqueness within org
    const existing = await pool.query(
      'SELECT id FROM "RestaurantTable" WHERE name = $1 AND "organizationId" = $2',
      [name.trim(), session.organizationId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A table with this name already exists' }, { status: 409 })
    }

    const tableId = 'c' + Math.random().toString(36).slice(2, 24)
    await pool.query(
      `INSERT INTO "RestaurantTable" (id, name, capacity, location, status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'FREE', $5, NOW(), NOW())`,
      [tableId, name.trim(), Number(capacity), location?.trim() || null, session.organizationId]
    )

    const result = await pool.query('SELECT * FROM "RestaurantTable" WHERE id = $1', [tableId])
    return NextResponse.json({ success: true, table: result.rows[0] }, { status: 201 })
  } catch (err: any) {
    console.error('[tables] POST error:', err?.message)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}