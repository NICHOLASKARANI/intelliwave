export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  budget: z.number().optional(),
  currency: z.string().default('KES'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().default('PENDING'),
})

// GET all projects for tenant
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = `
      SELECT p.id, p.title, p.description, p.status, p.budget, p.currency,
             p."startDate", p."endDate", p."createdAt",
             u.name as client_name, u.email as client_email,
             (SELECT COUNT(*) FROM "Milestone" m WHERE m."projectId" = p.id) as milestone_count
      FROM "Project" p
      LEFT JOIN "User" u ON u.id = p."clientId"
      WHERE p."organizationId" = $1
    `
    const params: any[] = [orgId]

    if (status && status !== 'ALL') {
      params.push(status)
      query += ` AND p.status = $${params.length}`
    }

    query += ` ORDER BY p."createdAt" DESC LIMIT 50`

    const result = await pool.query(query, params)

    return NextResponse.json({ projects: result.rows })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create project
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = projectSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "Project" (id, title, description, status, budget, currency, "startDate", "endDate", "clientId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, title, status`,
      [
        validated.title,
        validated.description || '',
        validated.status,
        validated.budget || null,
        validated.currency,
        validated.startDate ? new Date(validated.startDate) : null,
        validated.endDate ? new Date(validated.endDate) : null,
        session.userId,
        orgId,
      ]
    )

    return NextResponse.json({ success: true, project: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('Projects POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}