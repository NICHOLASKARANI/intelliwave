export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const transactionSchema = z.object({
  bankAccountId: z.string(),
  date: z.string(),
  description: z.string().min(1),
  reference: z.string().optional(),
  amount: z.number(),
  type: z.enum(['CREDIT', 'DEBIT']),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get('bankAccountId')
    const matched = searchParams.get('matched')

    let query = `
      SELECT bt.*, ba.name as bank_name, ba."accountNumber"
      FROM "BankTransaction" bt
      JOIN "BankAccount" ba ON ba.id = bt."bankAccountId"
      WHERE bt."organizationId" = $1
    `
    const params: any[] = [session!.organizationId]

    if (bankAccountId) {
      params.push(bankAccountId)
      query += ` AND bt."bankAccountId" = $${params.length}`
    }

    if (matched === 'true') {
      query += ` AND bt.matched = true`
    } else if (matched === 'false') {
      query += ` AND bt.matched = false`
    }

    query += ` ORDER BY bt.date DESC LIMIT 100`

    const result = await pool.query(query, params)

    return NextResponse.json({ transactions: result.rows })
  } catch (error) {
    console.error('BankTransaction GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const validated = transactionSchema.parse(body)

    // Verify bank account belongs to tenant
    const account = await pool.query(
      'SELECT id FROM "BankAccount" WHERE id = $1 AND "organizationId" = $2',
      [validated.bankAccountId, session!.organizationId]
    )

    if (account.rows.length === 0) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
    }

    const result = await pool.query(
      `INSERT INTO "BankTransaction" (id, "bankAccountId", date, description, reference, amount, type, "organizationId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [validated.bankAccountId, new Date(validated.date), validated.description, validated.reference || null, validated.amount, validated.type, session!.organizationId]
    )

    return NextResponse.json({ success: true, transactionId: result.rows[0].id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('BankTransaction POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}