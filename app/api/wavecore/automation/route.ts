export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List all workflows for tenant
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Workflow" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ workflows: result.rows })
  } catch (error) {
    return NextResponse.json({ workflows: [] })
  }
}

// POST: Create new workflow
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const workflowId = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Workflow" (id, name, trigger, status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'ACTIVE', $4, NOW(), NOW())
       RETURNING *`,
      [workflowId, body.name, body.trigger || 'Schedule', session.organizationId]
    )

    return NextResponse.json({ workflow: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PUT: Update workflow
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Workflow" SET name = $1, trigger = $2, status = $3, "updatedAt" = NOW()
       WHERE id = $4 AND "organizationId" = $5
       RETURNING *`,
      [body.name, body.trigger, body.status, body.id, session.organizationId]
    )

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ workflow: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Delete workflow
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "Workflow" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}