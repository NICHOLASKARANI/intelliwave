export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// GET: List journal entries
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT je.*, 
        (SELECT COUNT(*) FROM "JournalItem" ji WHERE ji."journalEntryId" = je.id) as "itemCount",
        (SELECT COALESCE(SUM(ji.debit), 0) FROM "JournalItem" ji WHERE ji."journalEntryId" = je.id) as "totalDebit",
        (SELECT COALESCE(SUM(ji.credit), 0) FROM "JournalItem" ji WHERE ji."journalEntryId" = je.id) as "totalCredit"
       FROM "JournalEntry" je 
       WHERE je."organizationId" = $1 
       ORDER BY je."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    const entries = result.rows
    const totalEntries = entries.length
    const totalAmount = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0)

    return NextResponse.json({ entries, totalEntries, totalAmount })
  } catch (error) {
    console.error('Journal GET error:', error)
    return NextResponse.json({ entries: [], totalEntries: 0, totalAmount: 0 })
  }
}

// POST: Create journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const entryId = crypto.randomUUID()
    const entryNumber = 'JE-' + Date.now().toString().slice(-8)

    // Calculate total amount
    const items = body.items || []
    const totalDebit = items.reduce((sum, i) => sum + Number(i.debit || 0), 0)
    const totalCredit = items.reduce((sum, i) => sum + Number(i.credit || 0), 0)

    // Validate debits = credits
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: 'Debits must equal credits' }, { status: 400 })
    }

    // Create journal entry using CORRECT columns
    const result = await pool.query(
      `INSERT INTO "JournalEntry" (id, number, date, reference, description, status, amount, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
      [
        entryId,
        entryNumber,
        body.date || new Date().toISOString().split('T')[0],
        body.reference || null,
        body.description || '',
        body.status || 'POSTED',
        totalDebit,
        session.organizationId
      ]
    )

    // Create journal items
    for (const item of items) {
      await pool.query(
        `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), entryId, item.accountId, item.debit || 0, item.credit || 0, session.organizationId]
      )
    }

    return NextResponse.json({ 
      entry: { ...result.rows[0], itemCount: items.length, totalDebit, totalCredit }
    }, { status: 201 })
  } catch (error) {
    console.error('Journal create error:', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PUT: Update journal entry status
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "JournalEntry" SET status = $1, "updatedAt" = NOW() WHERE id = $2 AND "organizationId" = $3 RETURNING *`,
      [body.status, body.id, session.organizationId]
    )
    return NextResponse.json({ entry: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE: Delete journal entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Delete items first, then entry
    await pool.query(`DELETE FROM "JournalItem" WHERE "journalEntryId" = $1`, [id])
    await pool.query(`DELETE FROM "JournalEntry" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}