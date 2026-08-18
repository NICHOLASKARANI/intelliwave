export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isReconcilable: z.boolean().default(false),
})

// GET - Returns EMPTY array for new orgs
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '50'))
    const offset = (page - 1) * pageSize

    let query = `
      SELECT id, code, name, type, "parentId", description, "isReconcilable", "isActive", "createdAt"
      FROM "ChartOfAccount"
      WHERE "organizationId" = $1
    `
    const params: any[] = [orgId]

    if (type && type !== 'ALL') {
      params.push(type)
      query += ` AND type = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`
    }

    query += ` ORDER BY code ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageSize, offset)

    const result = await pool.query(query, params)

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM "ChartOfAccount" WHERE "organizationId" = $1',
      [orgId]
    )

    return NextResponse.json({
      accounts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize),
    })
  } catch (error) {
    console.error('ChartOfAccount GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const body = await request.json()
    const validated = accountSchema.parse(body)

    // Check duplicate code within org
    const existing = await pool.query(
      'SELECT id FROM "ChartOfAccount" WHERE code = $1 AND "organizationId" = $2',
      [validated.code, orgId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Account code already exists' }, { status: 409 })
    }

    // Verify parent belongs to same org
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
      `INSERT INTO "ChartOfAccount" (id, code, name, type, "parentId", description, "isReconcilable", "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, true, $7, NOW(), NOW())
       RETURNING id, code, name, type`,
      [validated.code, validated.name, validated.type, validated.parentId || null, validated.description || null, validated.isReconcilable, orgId]
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