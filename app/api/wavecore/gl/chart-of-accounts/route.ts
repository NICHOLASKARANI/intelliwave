export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const accountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parentId: z.string().optional(),
  isReconcilable: z.boolean().default(false),
  description: z.string().optional(),
})

// GET all accounts for current tenant
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT id, code, name, type, "parentId", "isActive", "isReconcilable", description, "createdAt"
       FROM "ChartOfAccount"
       WHERE "organizationId" = $1
       ORDER BY code ASC`,
      [orgId]
    )

    return NextResponse.json({ accounts: result.rows })
  } catch (error) {
    console.error('ChartOfAccount GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new account
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = accountSchema.parse(body)

    // Verify parent belongs to same org if provided
    if (validated.parentId) {
      const parent = await pool.query(
        'SELECT id FROM "ChartOfAccount" WHERE id = $1 AND "organizationId" = $2',
        [validated.parentId, orgId]
      )
      if (parent.rows.length === 0) {
        return NextResponse.json({ error: 'Parent account not found' }, { status: 404 })
      }
    }

    const result = await pool.query(
      `INSERT INTO "ChartOfAccount" (id, code, name, type, "parentId", "isReconcilable", description, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, code, name, type`,
      [validated.code, validated.name, validated.type, validated.parentId || null, validated.isReconcilable, validated.description || null, orgId]
    )

    return NextResponse.json({ success: true, account: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('ChartOfAccount POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}