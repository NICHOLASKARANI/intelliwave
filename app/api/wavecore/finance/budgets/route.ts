export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const budgetSchema = z.object({
  name: z.string().min(1),
  fiscalYear: z.number().int().min(2020).max(2100),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  lines: z.array(z.object({
    accountId: z.string(),
    amount: z.number().min(0),
  })).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT b.*,
              (SELECT COALESCE(SUM(bl.amount), 0) FROM "BudgetLine" bl WHERE bl."budgetId" = b.id) as total_budget
       FROM "Budget" b
       WHERE b."organizationId" = $1
       ORDER BY b."createdAt" DESC`,
      [orgId]
    )

    return NextResponse.json({ budgets: result.rows })
  } catch (error) {
    console.error('Budgets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = budgetSchema.parse(body)

    await client.query('BEGIN')

    // Create Budget table if not exists (for new deployments)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Budget" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "fiscalYear" INTEGER NOT NULL,
        "period" TEXT NOT NULL DEFAULT 'ANNUAL',
        "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "BudgetLine" (
        "id" TEXT NOT NULL,
        "budgetId" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
      )
    `)

    const budget = await client.query(
      `INSERT INTO "Budget" (id, name, "fiscalYear", period, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [validated.name, validated.fiscalYear, validated.period, orgId]
    )

    for (const line of validated.lines) {
      // Verify account belongs to tenant
      const account = await client.query(
        'SELECT id FROM "ChartOfAccount" WHERE id = $1 AND "organizationId" = $2',
        [line.accountId, orgId]
      )
      if (account.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }

      await client.query(
        `INSERT INTO "BudgetLine" (id, "budgetId", "accountId", amount, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())`,
        [budget.rows[0].id, line.accountId, line.amount]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({ success: true, budgetId: budget.rows[0].id }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}