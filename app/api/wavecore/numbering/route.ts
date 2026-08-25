export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List document numbering
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "DocumentNumbering" WHERE "organizationId" = $1 ORDER BY documenttype`,
      [session!.organizationId]
    )

    return NextResponse.json({ numbering: result.rows })
  } catch (error) {
    console.error('Numbering GET error:', error)
    return NextResponse.json({ numbering: [] })
  }
}

// POST: Save document numbering
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Upsert
    const result = await pool.query(
      `INSERT INTO "DocumentNumbering" (documenttype, prefix, nextnumber, "organizationId", "updatedat")
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT ("organizationId", documenttype) 
       DO UPDATE SET prefix = $2, nextnumber = $3, "updatedat" = NOW()
       RETURNING *`,
      [body.documenttype, body.prefix, body.nextnumber || 1, session!.organizationId]
    )

    return NextResponse.json({ numbering: result.rows[0], success: true })
  } catch (error) {
    console.error('Numbering POST error:', error)
    return NextResponse.json({ error: 'Failed to save numbering' }, { status: 500 })
  }
}