export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List email templates
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "EmailTemplate" WHERE "organizationId" = $1 ORDER BY "createdat" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ templates: result.rows })
  } catch (error) {
    console.error('Email GET error:', error)
    return NextResponse.json({ templates: [] })
  }
}

// POST: Create email template
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "EmailTemplate" (name, subject, body, active, "organizationId", "createdat")
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [body.name, body.subject, body.body || '', body.active !== false, session.organizationId]
    )

    return NextResponse.json({ template: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Email POST error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

// DELETE: Delete email template
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "EmailTemplate" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}