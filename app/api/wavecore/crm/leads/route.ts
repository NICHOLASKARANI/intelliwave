export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.string().default('NEW'),
  priority: z.string().default('MEDIUM'),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = 'SELECT * FROM "Lead" WHERE "organizationId" = $1'
    const params: any[] = [session.organizationId]

    if (status && status !== 'ALL') {
      params.push(status)
      query += ` AND status = $${params.length}`
    }

    query += ' ORDER BY "createdAt" DESC LIMIT 100'

    const result = await pool.query(query, params)

    return NextResponse.json({ leads: result.rows })
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = leadSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "Lead" (id, name, email, phone, company, source, status, priority, notes, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, name, status`,
      [validated.name, validated.email || null, validated.phone || null, validated.company || null, validated.source || null, validated.status, validated.priority, validated.notes || null, session.organizationId]
    )

    return NextResponse.json({ success: true, lead: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `UPDATE "Lead" SET name = $1, email = $2, phone = $3, status = $4, "updatedAt" = NOW()
       WHERE id = $5 AND "organizationId" = $6
       RETURNING *`,
      [body.name, body.email, body.phone, body.status, body.id, session.organizationId]
    )
    return NextResponse.json({ lead: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Lead" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}