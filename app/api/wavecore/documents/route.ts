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
       ORDER BY pf."createdAt" DESC LIMIT 100`
    )
    return NextResponse.json({ documents: result.rows })
  } catch (error) {
    return NextResponse.json({ documents: [] })
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

    // Get ANY project (Project table has no organizationId column)
    const projectResult = await pool.query(
      `SELECT id FROM "Project" LIMIT 1`
    )

    let projectId = null
    if (projectResult.rows.length > 0) {
      projectId = projectResult.rows[0].id
    } else {
      // Create a default project
      const newProject = await pool.query(
        `INSERT INTO "Project" (id, title, status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, 'Default Project', 'ACTIVE', NOW(), NOW())
         RETURNING id`
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
    console.error('Documents POST error:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}