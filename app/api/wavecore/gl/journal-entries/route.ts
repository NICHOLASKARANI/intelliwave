export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT je.*, 
        (SELECT json_agg(json_build_object('accountId', ji."accountId", 'debit', ji.debit, 'credit', ji.credit))
         FROM "JournalItem" ji WHERE ji."journalEntryId" = je.id) as items
       FROM "JournalEntry" je 
       WHERE je."organizationId" = $1 
       ORDER BY je."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ entries: result.rows })
  } catch (error) {
    return NextResponse.json({ entries: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const entryId = crypto.randomUUID()
    const entryNumber = 'JE-' + Date.now().toString().slice(-8)

    // Create journal entry
    const entryResult = await pool.query(
      `INSERT INTO "JournalEntry" (id, "entryNumber", description, date, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [entryId, entryNumber, body.description, body.date || new Date().toISOString().split('T')[0], session.organizationId]
    )

    // Create journal items (debits and credits)
    const items = body.items || []
    for (const item of items) {
      await pool.query(
        `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), entryId, item.accountId, item.debit || 0, item.credit || 0, session.organizationId]
      )
    }

    return NextResponse.json({ entry: entryResult.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await pool.query(`DELETE FROM "JournalItem" WHERE "journalEntryId" = $1`, [id])
    await pool.query(`DELETE FROM "JournalEntry" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}