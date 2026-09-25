export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: List workflows for the org
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const res = await pool.query(
      `SELECT * FROM "PDFWorkflow" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 200`,
      [orgId]
    )
    return NextResponse.json({ workflows: res.rows })
  } catch (error) {
    console.error('Workflows GET error:', error)
    return NextResponse.json({ workflows: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Create workflow
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Workflow name required' }, { status: 400 })
    if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json({ error: 'steps array required (at least 1)' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "PDFWorkflow"
        (id, name, description, steps, "isActive", "organizationId", "createdBy", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,true,$5,$6,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.name.trim(),
        body.description || null,
        JSON.stringify(body.steps),
        session.organizationId,
        session.userId,
      ]
    )
    return NextResponse.json({ workflow: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Workflows POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Remove workflow
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const result = await pool.query(
      `DELETE FROM "PDFWorkflow" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}