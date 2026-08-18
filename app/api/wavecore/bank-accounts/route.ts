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
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "BankAccount" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )
    return NextResponse.json({ bankAccounts: result.rows })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = bankAccountSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "BankAccount" (id, name, "accountNumber", "bankName", currency, "openingBalance", "currentBalance", "organizationId", "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $5, $6, true, NOW(), NOW())
       RETURNING id, name, "accountNumber", "bankName"`,
      [validated.name, validated.accountNumber, validated.bankName, validated.currency, validated.openingBalance, session.organizationId]
    )
    return NextResponse.json({ bankAccount: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "BankAccount" SET name = $1, "bankName" = $2, "updatedAt" = NOW()
       WHERE id = $3 AND "organizationId" = $4
       RETURNING id, name, "accountNumber", "bankName"`,
      [body.name, body.bankName, body.id, session.organizationId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ bankAccount: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`UPDATE "BankAccount" SET "isActive" = false WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}