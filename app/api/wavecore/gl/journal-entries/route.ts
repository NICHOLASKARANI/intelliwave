export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const journalEntrySchema = z.object({
  date: z.string(),
  reference: z.string().optional().nullable(),
  description: z.string().min(1),
  items: z.array(z.object({
    accountId: z.string(),
    description: z.string().optional().nullable(),
    debit: z.number().min(0),
    credit: z.number().min(0),
  })).min(2),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT je.id, je.number, je.date, je.reference, je.description, je.status, je.amount, je."createdAt"
       FROM "JournalEntry" je
       WHERE je."organizationId" = $1
       ORDER BY je."createdAt" DESC
       LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ entries: result.rows })
  } catch (error) {
    console.error('JournalEntry GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const body = await request.json()
    const validated = journalEntrySchema.parse(body)

    const totalDebit = validated.items.reduce((sum, i) => sum + i.debit, 0)
    const totalCredit = validated.items.reduce((sum, i) => sum + i.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json({ error: 'Debits must equal credits' }, { status: 422 })
    }

    await client.query('BEGIN')

    // Verify all accounts belong to tenant
    for (const item of validated.items) {
      const account = await client.query(
        'SELECT id FROM "ChartOfAccount" WHERE id = $1 AND "organizationId" = $2',
        [item.accountId, orgId]
      )
      if (account.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
    }

    const entryNumber = 'JE-' + Date.now().toString().slice(-8)
    const entryResult = await client.query(
      `INSERT INTO "JournalEntry" (id, number, date, reference, description, status, amount, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'POSTED', $5, $6, NOW(), NOW())
       RETURNING id`,
      [entryNumber, new Date(validated.date), validated.reference || null, validated.description, totalDebit, orgId]
    )

    const entryId = entryResult.rows[0].id

    for (const item of validated.items) {
      await client.query(
        `INSERT INTO "JournalItem" (id, description, debit, credit, "accountId", "journalEntryId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description || null, item.debit, item.credit, item.accountId, entryId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({ success: true, id: entryId, number: entryNumber }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('JournalEntry POST error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}