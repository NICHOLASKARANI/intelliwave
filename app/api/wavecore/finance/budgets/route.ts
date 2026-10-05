export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Idempotent — safe on every request. Adds the accountCode column the
// budget-vs-actual report reads, if it does not already exist.
let _budgetSchemaEnsured = false
async function ensureBudgetSchema() {
  if (_budgetSchemaEnsured) return
  await pool.query('ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "accountCode" TEXT').catch(() => {})
  await pool.query('ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "period" TEXT DEFAULT \'ANNUAL\'').catch(() => {})
  _budgetSchemaEnsured = true
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureBudgetSchema()

    const result = await pool.query(
      `SELECT id, name, "fiscalYear", period, amount, "accountCode" AS "accountCode", "createdAt"
       FROM "Budget" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    const budgets = result.rows
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0)

    return NextResponse.json({ budgets, totalBudget, count: budgets.length })
  } catch (error) {
    console.error('Budget GET error:', error)
    return NextResponse.json({ budgets: [], totalBudget: 0, count: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureBudgetSchema()

    const body = await request.json()
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'Budget name required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const accountCode = body.accountCode ? String(body.accountCode).trim() : null

    const result = await pool.query(
      `INSERT INTO "Budget" (id, name, "fiscalYear", period, amount, "accountCode", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [
        id,
        String(body.name).trim(),
        parseInt(body.fiscalYear) || new Date().getFullYear(),
        body.period || 'ANNUAL',
        parseFloat(body.amount) || 0,
        accountCode,
        session.organizationId,
      ]
    )

    return NextResponse.json({ budget: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Budget create error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await pool.query(`DELETE FROM "Budget" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}