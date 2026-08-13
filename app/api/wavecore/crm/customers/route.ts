export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  type: z.string().default('INDIVIDUAL'),
  status: z.string().default('ACTIVE'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM "CustomerInvoice" ci WHERE ci."customerId" = c.id) as invoice_count,
             (SELECT COALESCE(SUM(ci.total), 0) FROM "CustomerInvoice" ci WHERE ci."customerId" = c.id AND ci.status IN ('PAID','PARTIALLY_PAID')) as total_revenue
      FROM "Customer" c
      WHERE c."organizationId" = $1
    `
    const params: any[] = [session.organizationId]

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.company ILIKE $${params.length})`
    }

    query += ` ORDER BY c."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageSize, offset)

    const result = await pool.query(query, params)

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1',
      [session.organizationId]
    )

    return NextResponse.json({
      customers: result.rows,
      pagination: {
        page,
        pageSize,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize),
      },
    })
  } catch (error) {
    console.error('Customers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = customerSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "Customer" (id, name, email, phone, company, address, city, country, type, status, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, name, email`,
      [validated.name, validated.email || null, validated.phone || null, validated.company || null, validated.address || null, validated.city || null, validated.country || null, validated.type, validated.status, session.organizationId]
    )

    return NextResponse.json({ success: true, customer: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Customers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}