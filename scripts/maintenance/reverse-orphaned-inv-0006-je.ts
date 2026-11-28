/**
 * One-off maintenance: Reverse orphaned JE-42036790 (pre-P6c wrong-account JE).
 * Safe to re-run — idempotent. Zero deletes. Audit trail preserved.
 * Usage: npx tsx scripts/maintenance/reverse-orphaned-inv-0006-je.ts
 */

import { pool } from '../../lib/wavecore/db'
import { postJournal, hasJournalForSource } from '../../lib/wavecore/finance/post-journal'

const ORG_ID = '420f60b91a94803be31aa724'
const ORPHANED_JE_ID = '7605683b-81d3-4e35-9951-4da98110f945'

async function main() {
  const client = await pool.connect()
  try {
    console.log('=== Reversal of orphaned JE-42036790 ===')
    const jeRes = await client.query(
      `SELECT id, number, description, status, amount FROM "JournalEntry"
       WHERE id = $1 AND "organizationId" = $2`, [ORPHANED_JE_ID, ORG_ID])
    if (jeRes.rowCount === 0) { console.error('JE not found'); process.exit(1) }
    const je = jeRes.rows[0]
    console.log('BEFORE:', JSON.stringify({ number: je.number, status: je.status, amount: je.amount }, null, 2))

    if (je.status !== 'POSTED') { console.log('SKIP: status=' + je.status); return }
    if (await hasJournalForSource(client, ORG_ID, 'REVERSAL', ORPHANED_JE_ID)) { console.log('SKIP: reversal already exists'); return }

    const itemsRes = await client.query(
      `SELECT coa.code, ji.debit, ji.credit FROM "JournalItem" ji
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       WHERE ji."journalEntryId" = $1`, [ORPHANED_JE_ID])
    const reverseLines = itemsRes.rows.map((it: any) => ({
      accountCode: it.code,
      description: 'Reversal - ' + je.number,
      debit: Number(it.credit) || 0,
      credit: Number(it.debit) || 0,
    }))
    console.log('Reversal lines:', JSON.stringify(reverseLines, null, 2))

    await client.query('BEGIN')
    const rev = await postJournal(client, {
      organizationId: ORG_ID, date: new Date(),
      description: 'Reversal of orphaned ' + je.number + ' (pre-P6c artifact, INV-2026-0006)',
      reference: 'REV-' + je.number,
      lines: reverseLines,
      sourceType: 'REVERSAL', sourceId: ORPHANED_JE_ID,
      currency: 'KES', fxRate: 1,
    })
    await client.query(
      `UPDATE "JournalEntry" SET status = 'REVERSED', "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`, [ORPHANED_JE_ID, ORG_ID])
    await client.query('COMMIT')
    console.log('✅ REVERSED original=' + ORPHANED_JE_ID + ' reversalJE=' + rev.journalEntryId)
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('FAILED:', (err as Error).message); throw err
  } finally {
    client.release(); await pool.end()
  }
}
main().catch(e => { console.error(e); process.exit(1) })