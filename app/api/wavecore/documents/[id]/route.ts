export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const result = await pool.query(
      `SELECT pf.id, pf.name, pf.url, pf.type, pf.size, pf."createdAt"
       FROM "ProjectFile" pf
       JOIN "Project" p ON p.id = pf."projectId"
       WHERE pf.id = $1 AND p."organizationId" = $2`,
      [params.id, orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document: result.rows[0] })
  } catch (error) {
    console.error('Document [id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const result = await pool.query(
      `DELETE FROM "ProjectFile" pf
       USING "Project" p
       WHERE pf.id = $1 AND pf."projectId" = p.id AND p."organizationId" = $2`,
      [params.id, orgId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    console.error('Document [id] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}