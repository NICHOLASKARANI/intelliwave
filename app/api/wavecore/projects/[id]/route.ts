export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT p.*, u.name as client_name,
              (SELECT json_agg(json_build_object('id', m.id, 'title', m.title, 'description', m.description, 'dueDate', m."dueDate", 'completed', m.completed))
               FROM "Milestone" m WHERE m."projectId" = p.id) as milestones
       FROM "Project" p
       LEFT JOIN "User" u ON u.id = p."clientId"
       WHERE p.id = $1 AND p."organizationId" = $2`,
      [params.id, orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project: result.rows[0] })
  } catch (error) {
    console.error('Project [id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      'DELETE FROM "Project" WHERE id = $1 AND "organizationId" = $2',
      [params.id, orgId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Project deleted' })
  } catch (error) {
    console.error('Project [id] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}