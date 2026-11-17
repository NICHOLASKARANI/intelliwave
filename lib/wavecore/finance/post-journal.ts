/**
 * WaveCore Finance — GL Posting Helper
 *
 * Converts business events (invoices, payments, bills) into balanced
 * double-entry JournalEntry + JournalItem records. Tenant-isolated.
 *
 * Account codes used (must exist in ChartOfAccount):
 *   1200 Accounts Receivable
 *   2000 Accounts Payable
 *   2100 VAT Payable
 *   4000 Sales Revenue
 *   5000 Cost of Goods Sold
 *   1000 Cash
 *   1100 Bank Account
 */

import type { PoolClient } from 'pg'
import { pool } from '@/lib/wavecore/db'
import { resolveOpenPeriod } from '@/lib/wavecore/finance/fiscal-period'

export interface JournalLineInput {
  accountCode: string
  description: string
  debit: number
  credit: number
}

export interface PostJournalInput {
  organizationId: string
  date: Date | string
  description: string
  reference?: string | null
  lines: JournalLineInput[]
  sourceType?: string  // 'INVOICE' | 'PAYMENT' | 'BILL' | 'MANUAL'
  sourceId?: string
}

/**
 * Validate lines are balanced (sum debits == sum credits).
 * Throws if not balanced — caller should catch and rollback.
 */
function validateBalanced(lines: JournalLineInput[]) {
  const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  if (Math.abs(debit - credit) > 0.01) {
    throw new Error(
      `Journal not balanced: debits=${debit.toFixed(2)} credits=${credit.toFixed(2)} diff=${(debit - credit).toFixed(2)}`
    )
  }
  if (lines.length < 2) {
    throw new Error('Journal must have at least 2 lines')
  }
  if (lines.every(l => (Number(l.debit) || 0) === 0 && (Number(l.credit) || 0) === 0)) {
    throw new Error('Journal has no amounts')
  }
}

/**
 * Look up account IDs by code for this organization.
 * Throws if any account code is missing from ChartOfAccount.
 */
async function resolveAccountIds(
  client: PoolClient,
  orgId: string,
  codes: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(codes))
  const res = await client.query(
    `SELECT code, id FROM "ChartOfAccount"
     WHERE "organizationId" = $1 AND code = ANY($2)`,
    [orgId, unique]
  )
  const map = new Map<string, string>()
  for (const row of res.rows) map.set(row.code, row.id)

  const missing = unique.filter(c => !map.has(c))
  if (missing.length > 0) {
    throw new Error(
      `Chart of Accounts missing required codes: ${missing.join(', ')}. ` +
      `Run Quick Setup in Finance → Journal → Create to seed accounts.`
    )
  }
  return map
}

/**
 * Post a balanced journal entry to the GL.
 * Must be called inside a transaction on the same client as the source write,
 * so the source record and GL entry commit or rollback together.
 */
export async function postJournal(
  client: PoolClient,
  input: PostJournalInput
): Promise<{ journalEntryId: string }> {
  validateBalanced(input.lines)

  const codes = input.lines.map(l => l.accountCode)
  const accountIds = await resolveAccountIds(client, input.organizationId, codes)

  const crypto = require('crypto')
  const journalId = crypto.randomUUID()
  const journalNumber = 'JE-' + Date.now().toString().slice(-8)
  const dateStr = input.date instanceof Date
    ? input.date.toISOString()
    : new Date(input.date).toISOString()

  const description = input.sourceType
    ? `${input.description} [${input.sourceType}${input.sourceId ? ':' + input.sourceId.slice(0, 8) : ''}]`
    : input.description

  // Resolve (or auto-create) the open fiscal period for this posting date.
  // Throws if the target period is closed.
  const period = await resolveOpenPeriod(client, input.organizationId, dateStr)

  await client.query(
    `INSERT INTO "JournalEntry"
       (id, number, date, reference, description, status, amount,
        "fiscalPeriodId", "organizationId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'POSTED', $6, $7, $8, NOW(), NOW())`,
    [
      journalId,
      journalNumber,
      dateStr,
      input.reference || null,
      description,
      input.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0),
      period.periodId,
      input.organizationId,
    ]
  )

  for (const line of input.lines) {
    const accountId = accountIds.get(line.accountCode)!
    await client.query(
      `INSERT INTO "JournalItem"
         (id, "journalEntryId", "accountId", debit, credit, "organizationId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
      [
        journalId,
        accountId,
        Number(line.debit) || 0,
        Number(line.credit) || 0,
        input.organizationId,
      ]
    )
  }

  return { journalEntryId: journalId }
}

/**
 * Convenience: post an invoice to GL.
 *   DEBIT  1200 Accounts Receivable   total
 *   CREDIT 4000 Sales Revenue          subtotal
 *   CREDIT 2100 VAT Payable            taxAmount (only if > 0)
 */
export async function postInvoiceToGL(
  client: PoolClient,
  args: {
    organizationId: string
    invoiceId: string
    invoiceNumber: string
    date: Date | string
    subtotal: number
    taxAmount: number
    total: number
  }
) {
  const lines: JournalLineInput[] = [
    {
      accountCode: '1200',
      description: `AR — ${args.invoiceNumber}`,
      debit: args.total,
      credit: 0,
    },
    {
      accountCode: '4000',
      description: `Revenue — ${args.invoiceNumber}`,
      debit: 0,
      credit: args.subtotal,
    },
  ]
  if (args.taxAmount > 0.01) {
    lines.push({
      accountCode: '2100',
      description: `VAT — ${args.invoiceNumber}`,
      debit: 0,
      credit: args.taxAmount,
    })
  }

  return postJournal(client, {
    organizationId: args.organizationId,
    date: args.date,
    description: `Invoice ${args.invoiceNumber} issued`,
    reference: args.invoiceNumber,
    lines,
    sourceType: 'INVOICE',
    sourceId: args.invoiceId,
  })
}

/**
 * Convenience: post a customer payment to GL.
 *   DEBIT  1100 Bank Account  amount
 *   CREDIT 1200 AR            amount
 */
export async function postPaymentToGL(
  client: PoolClient,
  args: {
    organizationId: string
    paymentId: string
    reference: string
    date: Date | string
    amount: number
  }
) {
  return postJournal(client, {
    organizationId: args.organizationId,
    date: args.date,
    description: `Customer payment ${args.reference}`,
    reference: args.reference,
    lines: [
      { accountCode: '1100', description: `Bank — ${args.reference}`, debit: args.amount, credit: 0 },
      { accountCode: '1200', description: `AR — ${args.reference}`, debit: 0, credit: args.amount },
    ],
    sourceType: 'PAYMENT',
    sourceId: args.paymentId,
  })
}

/**
 * Check whether a source entity already has a GL posting.
 * Prevents double-posting if invoice POST is retried.
 */
export async function hasJournalForSource(
  client: PoolClient,
  orgId: string,
  sourceType: string,
  sourceId: string
): Promise<boolean> {
  const tag = `[${sourceType}:${sourceId.slice(0, 8)}]`
  const res = await client.query(
    `SELECT 1 FROM "JournalEntry"
     WHERE "organizationId" = $1 AND description LIKE $2
     LIMIT 1`,
    [orgId, `%${tag}%`]
  )
  return (res.rowCount ?? 0) > 0
}
/**
 * Post a supplier bill (AP invoice) to GL.
 *
 *   DEBIT  5000 Cost of Goods Sold   subtotal   (default — can be overridden)
 *   CREDIT 2000 Accounts Payable     total
 *   CREDIT 2100 VAT Payable          taxAmount (only if > 0)
 *
 * Idempotent: if a JE tagged [BILL:<first8>] already exists for this bill,
 * returns early with the existing id — prevents double-posting on retry.
 *
 * Must be called inside a caller-owned transaction on the same client.
 */
export async function postBillToGL(
  client: PoolClient,
  args: {
    organizationId: string
    billId: string
    billNumber: string
    date: Date | string
    subtotal: number
    taxAmount: number
    total: number
    expenseCode?: string  // default '5000' Cost of Goods Sold
  }
): Promise<{ journalEntryId: string; skipped: boolean }> {
  // Zero-amount bills don't need a GL entry
  if (Number(args.total) <= 0.01) {
    return { journalEntryId: '', skipped: true }
  }

  const tag = `[BILL:${String(args.billId).slice(0, 8)}]`
  const existing = await client.query(
    `SELECT id FROM "JournalEntry"
     WHERE "organizationId" = $1 AND description LIKE $2
     LIMIT 1`,
    [args.organizationId, `%${tag}%`]
  )
  if ((existing.rowCount ?? 0) > 0) {
    return { journalEntryId: existing.rows[0].id, skipped: true }
  }

  const expenseCode = args.expenseCode || '5000'
  const lines: JournalLineInput[] = [
    {
      accountCode: expenseCode,
      description: `Bill ${args.billNumber} — expense`,
      debit: Number(args.subtotal) || 0,
      credit: 0,
    },
    {
      accountCode: '2000',
      description: `AP — ${args.billNumber}`,
      debit: 0,
      credit: Number(args.total) || 0,
    },
  ]
  if (Number(args.taxAmount) > 0.01) {
    lines.push({
      accountCode: '2100',
      description: `VAT — ${args.billNumber}`,
      debit: 0,
      credit: Number(args.taxAmount),
    })
  }

  const result = await postJournal(client, {
    organizationId: args.organizationId,
    date: args.date,
    description: `Supplier bill ${args.billNumber} approved [BILL:${String(args.billId).slice(0, 8)}]`,
    reference: args.billNumber,
    lines,
    sourceType: 'BILL',
    sourceId: args.billId,
  })

  return { journalEntryId: result.journalEntryId, skipped: false }
}