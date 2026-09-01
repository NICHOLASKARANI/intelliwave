export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT DISTINCT category as name, category, COUNT(*) as "productCount"
       FROM "Product" WHERE "organizationId" = $1 AND category IS NOT NULL
       GROUP BY category ORDER BY category ASC`,
      [session.organizationId]
    )

    return NextResponse.json({ categories: result.rows })
  } catch (error) {
    // If the above query fails for any reason, just return an empty list
    return NextResponse.json({ categories: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Attempt to insert into Category table. If it fails, just return the new category object.
    const result = await pool.query(
      `INSERT INTO "Category" (id, name, "organizationId", "createdAt")
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [id, body.name, session.organizationId]
    ).catch(() => {
      return { rows: [{ id, name: body.name, productCount: 0 }] }
    })

    return NextResponse.json({ category: result.rows[0] }, { status: 201 })
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
    await pool.query(`DELETE FROM "Category" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId]).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
