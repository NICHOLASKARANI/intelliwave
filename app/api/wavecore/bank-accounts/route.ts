export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const bankAccountSchema = z.object({
  name: z.string().min(1),
  accountNumber: z.string().min(1),
  bankName: z.string().min(1),
  currency: z.string().default('KES'),
  openingBalance: z.number().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT ba.*,
              (SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0)
               FROM "BankTransaction" bt WHERE bt."bankAccountId" = ba.id AND bt.matched = true) as reconciled_balance,
              (SELECT COUNT(*) FROM "BankTransaction" bt WHERE bt."bankAccountId" = ba.id AND bt.matched = false) as unmatched_count
       FROM "BankAccount" ba
       WHERE ba."organizationId" = $1 AND ba."isActive" = true
       ORDER BY ba."createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ bankAccounts: result.rows })
  } catch (error) {
    console.error('BankAccount GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = bankAccountSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "BankAccount" (id, name, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", "organizationId", "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $5, $6, true, NOW(), NOW())
       RETURNING id, name, "accountNumber", "bankName"`,
      [validated.name, validated.accountNumber, validated.bankName, validated.currency, validated.openingBalance, session.organizationId]
    )

    return NextResponse.json({ success: true, bankAccount: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('BankAccount POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}