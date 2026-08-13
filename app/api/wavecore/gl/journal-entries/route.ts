export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const journalEntrySchema = z.object({
  date: z.string(),
  reference: z.string().optional(),
  description: z.string().min(1),
  items: z.array(z.object({
    accountId: z.string(),
    description: z.string().optional(),
    debit: z.number().min(0),
    credit: z.number().min(0),
  })).min(2),
})

// GET all journal entries for tenant
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT je.id, je.number, je.date, je.reference, je.description, je.status, je.amount,
              je."createdAt",
              (SELECT json_agg(json_build_object('id', ji.id, 'description', ji.description, 'debit', ji.debit, 'credit', ji.credit, 'accountName', coa.name))
               FROM "JournalItem" ji
               JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
               WHERE ji."journalEntryId" = je.id) as items
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

// POST create journal entry with transaction
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = journalEntrySchema.parse(body)

    // Validate debits = credits
    const totalDebit = validated.items.reduce((sum, item) => sum + item.debit, 0)
    const totalCredit = validated.items.reduce((sum, item) => sum + item.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: 'Debits must equal credits' }, { status: 422 })
    }

    await client.query('BEGIN')

    // Validate all accounts belong to tenant
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

    const journalId = await client.query(
      `INSERT INTO "JournalEntry" (id, number, date, reference, description, status, amount, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, gen_random_uuid()::text, $1, $2, $3, 'POSTED', $4, $5, NOW(), NOW())
       RETURNING id`,
      [new Date(validated.date), validated.reference || null, validated.description, totalDebit, orgId]
    )

    for (const item of validated.items) {
      await client.query(
        `INSERT INTO "JournalItem" (id, description, debit, credit, "accountId", "journalEntryId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description || null, item.debit, item.credit, item.accountId, journalId.rows[0].id]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({ success: true, id: journalId.rows[0].id }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('JournalEntry POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}