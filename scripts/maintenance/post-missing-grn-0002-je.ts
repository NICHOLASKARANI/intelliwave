/**
 * One-off maintenance: Post the missing GL accrual for GRN-2026-0002.
 * Safe to re-run — idempotent via hasJournalForSource().
 * Usage: npx tsx scripts/maintenance/post-missing-grn-0002-je.ts
 */

import { pool } from '../../lib/wavecore/db'
import { postJournal, hasJournalForSource } from '../../lib/wavecore/finance/post-journal'

const ORG_ID = '420f60b91a94803be31aa724'
const GRN_ID = 'b97918e3-715f-4b57-b7b4-410506a30cf3'

async function main() {
  const client = await pool.connect()
  try {
    console.log('=== GRN-2026-0002 missing-JE fix ===')
    const grnRes = await client.query(
      `SELECT id, "grnNumber", "receivedAt", status, "journalEntryId", "postedAt", "totalReceived"
       FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
      [GRN_ID, ORG_ID])
    if (grnRes.rowCount === 0) { console.error('GRN not found'); process.exit(1) }
    const grn = grnRes.rows[0]
    console.log('BEFORE:', JSON.stringify({ number: grn.grnNumber, status: grn.status, total: grn.totalReceived, je: grn.journalEntryId, postedAt: grn.postedAt }, null, 2))

    if (grn.journalEntryId) { console.log('SKIP: already has journalEntryId'); return }
    if (await hasJournalForSource(client, ORG_ID, 'GRN', GRN_ID)) { console.log('SKIP: [GRN:...] JE already exists'); return }

    const linesRes = await client.query(
      `SELECT "receivedQty", "rejectedQty", "damagedQty", "unitPrice"
       FROM "GoodsReceiptLine" WHERE "goodsReceiptId" = $1 AND "organizationId" = $2`,
      [GRN_ID, ORG_ID])
    const glValue = linesRes.rows.reduce((sum: number, l: any) => {
      const acc = Math.max(0, Number(l.receivedQty||0) - Number(l.rejectedQty||0) - Number(l.damagedQty||0))
      return sum + (acc * Number(l.unitPrice||0))
    }, 0)
    console.log('Computed GL value:', glValue)
    if (glValue <= 0.01) { console.log('SKIP: zero GL value'); return }

    await client.query('BEGIN')
    const je = await postJournal(client, {
      organizationId: ORG_ID, date: grn.receivedAt,
      description: 'Goods received ' + grn.grnNumber,
      reference: 'GRN-' + String(grn.id).slice(0, 8),
      lines: [
        { accountCode: '1300', description: 'Inventory - ' + grn.grnNumber, debit: glValue, credit: 0 },
        { accountCode: '2150', description: 'GRNI - ' + grn.grnNumber, debit: 0, credit: glValue },
      ],
      sourceType: 'GRN', sourceId: grn.id, currency: 'KES', fxRate: 1,
    })
    await client.query(
      `UPDATE "GoodsReceipt" SET "journalEntryId" = $1, "postedAt" = NOW()
       WHERE id = $2 AND "organizationId" = $3`,
      [je.journalEntryId, GRN_ID, ORG_ID])
    await client.query('COMMIT')
    console.log('✅ POSTED journalEntryId=' + je.journalEntryId + ' amount=' + glValue)
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('FAILED:', (err as Error).message); throw err
  } finally {
    client.release(); await pool.end()
  }
}
main().catch(e => { console.error(e); process.exit(1) })