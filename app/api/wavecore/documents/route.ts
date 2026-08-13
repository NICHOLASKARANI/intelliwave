export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT pf.id, pf.name, pf.url, pf.type, pf.size, pf."createdAt",
              p.title as project_title
       FROM "ProjectFile" pf
       LEFT JOIN "Project" p ON p.id = pf."projectId"
       WHERE p."organizationId" = $1
       ORDER BY pf."createdAt" DESC
       LIMIT 100`,
      [orgId]
    )

    return NextResponse.json({ documents: result.rows })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const { name, url, type, size, projectId } = body

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    // Verify project belongs to tenant
    if (projectId) {
      const project = await pool.query(
        'SELECT id FROM "Project" WHERE id = $1 AND "organizationId" = $2',
        [projectId, orgId]
      )
      if (project.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    const result = await pool.query(
      `INSERT INTO "ProjectFile" (id, name, url, type, size, "projectId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())
       RETURNING id, name, url`,
      [name, url, type || 'other', size || 0, projectId]
    )

    return NextResponse.json({ success: true, document: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}