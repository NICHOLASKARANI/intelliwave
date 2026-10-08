export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { checkCsrf } from '@/lib/wavecore/csrf'
import { ensureAutomationSchema } from '@/lib/wavecore/automation-schema'

// GET: List workflow templates for tenant
export async function GET(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "WorkflowTemplate" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session!.organizationId]
    )
    return NextResponse.json({ templates: result.rows })
  } catch (error) {
    console.error('[templates GET]', error)
    return NextResponse.json({ templates: [], error: 'Failed to load templates' }, { status: 500 })
  }
}

// POST: Create template
export async function POST(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "WorkflowTemplate" (id, name, description, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [id, body.name, body.description || null, session!.organizationId]
    )
    return NextResponse.json({ template: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PUT: Update template
export async function PUT(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "WorkflowTemplate" SET name = $1, description = $2, "updatedAt" = NOW()
       WHERE id = $3 AND "organizationId" = $4
       RETURNING *`,
      [body.name, body.description || null, body.id, session!.organizationId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ template: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Delete template
export async function DELETE(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(
      `DELETE FROM "WorkflowTemplate" WHERE id = $1 AND "organizationId" = $2`,
      [id, session!.organizationId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}
