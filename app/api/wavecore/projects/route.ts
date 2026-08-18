export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "Project" ORDER BY "createdAt" DESC LIMIT 100`)
    return NextResponse.json({ projects: result.rows })
  } catch (error) {
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get session for clientId
    const session = await requireTenant(request)
    const clientId = session?.userId || 'default-client'
    
    // Required columns: id, title, description (NOT NULL), status (default PENDING), currency (default KES), clientId (NOT NULL)
    const result = await pool.query(
      `INSERT INTO "Project" (id, title, description, status, currency, "clientId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, COALESCE($2, 'No description'), COALESCE($3, 'PENDING'), COALESCE($4, 'KES'), $5, NOW(), NOW())
       RETURNING *`,
      [
        body.title,
        body.description || 'No description',
        body.status || 'PENDING',
        body.currency || 'KES',
        clientId,
      ]
    )
    
    return NextResponse.json({ project: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Project POST error:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Project" SET title = $1, description = COALESCE($2, description), status = COALESCE($3, status), "updatedAt" = NOW()
       WHERE id = $4
       RETURNING *`,
      [body.title, body.description, body.status, body.id]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Project" WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}