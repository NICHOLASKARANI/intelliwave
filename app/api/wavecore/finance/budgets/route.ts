export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const budgetSchema = z.object({
  name: z.string().min(1),
  fiscalYear: z.number().int(),
  period: z.string().default('ANNUAL'),
  amount: z.number().min(0).optional(),
  lines: z.array(z.object({ accountId: z.string(), amount: z.number() })).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Budget" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "fiscalYear" INTEGER NOT NULL,
        "period" TEXT NOT NULL DEFAULT 'ANNUAL', "amount" DOUBLE PRECISION DEFAULT 0,
        "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
      )
    `)

    const result = await pool.query(
      'SELECT * FROM "Budget" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [orgId]
    )

    return NextResponse.json({ budgets: result.rows })
  } catch (error) {
    console.error('Budgets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = budgetSchema.parse(body)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Budget" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "fiscalYear" INTEGER NOT NULL,
        "period" TEXT NOT NULL DEFAULT 'ANNUAL', "amount" DOUBLE PRECISION DEFAULT 0,
        "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
      )
    `)

    const result = await pool.query(
      `INSERT INTO "Budget" (id, name, "fiscalYear", period, amount, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id`,
      [validated.name, validated.fiscalYear, validated.period, validated.amount || 0, orgId]
    )

    return NextResponse.json({ success: true, budgetId: result.rows[0].id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}