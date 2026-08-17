export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

async function getOrgAndClient() {
  // Get first organization
  const org = await pool.query('SELECT id FROM "Organization" LIMIT 1')
  const orgId = org.rows.length > 0 ? org.rows[0].id : null

  // Get first user as client
  const user = await pool.query('SELECT id FROM "User" LIMIT 1')
  const clientId = user.rows.length > 0 ? user.rows[0].id : null

  return { orgId, clientId }
}

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM "Milestone" m WHERE m."projectId" = p.id) as milestone_count
       FROM "Project" p ORDER BY p."createdAt" DESC LIMIT 100`
    )
    return NextResponse.json({ projects: result.rows })
  } catch (error: any) {
    console.error('Projects GET:', error.message)
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { orgId, clientId } = await getOrgAndClient()

    if (!orgId || !clientId) {
      return NextResponse.json({ error: 'No organization or user found' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO "Project" ("id", "title", "description", "status", "budget", "currency", "startDate", "endDate", "clientId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'KES', $5, $6, $7, NOW(), NOW()) 
       RETURNING *`,
      [
        body.title,
        body.description || '',
        body.status || 'PENDING',
        parseFloat(body.budget) || 0,
        body.startDate ? new Date(body.startDate) : null,
        body.endDate ? new Date(body.endDate) : null,
        clientId,
      ]
    )

    return NextResponse.json({ success: true, project: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Projects POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}