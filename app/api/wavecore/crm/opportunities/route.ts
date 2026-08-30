export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const opportunitySchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  stage: z.string().default('QUALIFICATION'),
  probability: z.number().min(0).max(100).default(0),
  customerId: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const result = await pool.query(
      `SELECT o.*, c.name as customer_name
       FROM "Opportunity" o
       LEFT JOIN "Customer" c ON c.id = o."customerId"
       WHERE o."organizationId" = $1
       ORDER BY o."createdAt" DESC
       LIMIT 100`,
      [session!.organizationId]
    )

    return NextResponse.json({ opportunities: result.rows })
  } catch (error) {
    console.error('Opportunities GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const validated = opportunitySchema.parse(body)

    // Verify customer belongs to tenant if provided
    if (validated.customerId) {
      const customer = await pool.query(
        'SELECT id FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
        [validated.customerId, session!.organizationId]
      )
      if (customer.rows.length === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
    }

    const result = await pool.query(
      `INSERT INTO "Opportunity" (id, name, amount, stage, probability, "customerId", "expectedCloseDate", notes, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, name, amount, stage`,
      [validated.name, validated.amount, validated.stage, validated.probability, validated.customerId || null, validated.expectedCloseDate ? new Date(validated.expectedCloseDate) : null, validated.notes || null, session!.organizationId]
    )

    return NextResponse.json({ success: true, opportunity: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Opportunities POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Opportunity" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}