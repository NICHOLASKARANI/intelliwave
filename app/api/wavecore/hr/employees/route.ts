export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const employeeSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentType: z.string().default('FULL_TIME'),
  status: z.string().default('ACTIVE'),
  salary: z.number().min(0).default(0),
  currency: z.string().default('KES'),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  hireDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const department = searchParams.get('department')

    let query = 'SELECT * FROM "Employee" WHERE "organizationId" = $1'
    const params: any[] = [session.organizationId]

    if (search) {
      params.push(`%${search}%`)
      query += ` AND ("firstName" ILIKE $${params.length} OR "lastName" ILIKE $${params.length} OR email ILIKE $${params.length})`
    }

    if (department) {
      params.push(department)
      query += ` AND department = $${params.length}`
    }

    query += ' ORDER BY "createdAt" DESC LIMIT 100'

    const result = await pool.query(query, params)

    return NextResponse.json({ employees: result.rows })
  } catch (error) {
    console.error('Employees GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const validated = employeeSchema.parse(body)

    // Check employee ID uniqueness
    const existing = await pool.query(
      'SELECT id FROM "Employee" WHERE "employeeId" = $1 AND "organizationId" = $2',
      [validated.employeeId, session.organizationId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 })
    }

    const result = await pool.query(
      `INSERT INTO "Employee" (
        id, "employeeId", "firstName", "lastName", email, phone, department, position,
        "employmentType", status, salary, currency, "bankName", "bankAccount", "hireDate",
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING id, "employeeId", "firstName", "lastName"`,
      [
        validated.employeeId, validated.firstName, validated.lastName,
        validated.email || null, validated.phone || null, validated.department || null,
        validated.position || null, validated.employmentType, validated.status,
        validated.salary, validated.currency, validated.bankName || null,
        validated.bankAccount || null, validated.hireDate ? new Date(validated.hireDate) : null,
        session.organizationId,
      ]
    )

    return NextResponse.json({ success: true, employee: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Employees POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `UPDATE "Employee" SET "firstName" = $1, "lastName" = $2, email = $3, department = $4, "updatedAt" = NOW()
       WHERE id = $5 AND "organizationId" = $6
       RETURNING *`,
      [body.firstName, body.lastName, body.email, body.department, body.id, session.organizationId]
    )
    return NextResponse.json({ employee: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Employee" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}