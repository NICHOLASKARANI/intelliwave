export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ documents: [] })

    const result = await pool.query(
      `SELECT pf.* FROM "ProjectFile" pf
       JOIN "Project" p ON p.id = pf."projectId"
       WHERE p."organizationId" = $1
       ORDER BY pf."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )
    return NextResponse.json({ documents: result.rows })
  } catch (error) {
    return NextResponse.json({ documents: [], error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    if (!body.name || !body.url) {
      return NextResponse.json({ error: 'Name and URL required' }, { status: 400 })
    }

    // Get first project for this org (or create a default)
    const projectResult = await pool.query(
      `SELECT id FROM "Project" WHERE "organizationId" = $1 LIMIT 1`,
      [session.organizationId]
    )

    let projectId = null
    if (projectResult.rows.length > 0) {
      projectId = projectResult.rows[0].id
    } else {
      // Create a default project
      const newProject = await pool.query(
        `INSERT INTO "Project" (id, title, status, "organizationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, 'Default Project', 'ACTIVE', $1, NOW(), NOW())
         RETURNING id`,
        [session.organizationId]
      )
      projectId = newProject.rows[0].id
    }

    const result = await pool.query(
      `INSERT INTO "ProjectFile" (id, name, url, type, size, "projectId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())
       RETURNING id, name, url, type, size, "createdAt"`,
      [body.name, body.url, body.type || 'DOCUMENT', parseInt(body.size) || 0, projectId]
    )

    return NextResponse.json({ success: true, document: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Documents POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}