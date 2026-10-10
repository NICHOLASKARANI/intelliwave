/**
 * Idempotent InvoiceItem schema bootstrap.
 * The production DB has CustomerInvoice but not InvoiceItem.
 * The invoices POST route silently swallowed the missing-table
 * error, so every invoice ever created has zero line items.
 * This creates the table the first time any invoices route runs.
 */
import { pool } from '@/lib/wavecore/db'

let _ensured = false

export async function ensureInvoiceSchema(): Promise<void> {
  if (_ensured) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InvoiceItem" (
      id               TEXT PRIMARY KEY,
      "invoiceId"      TEXT NOT NULL,
      description      TEXT NOT NULL,
      quantity         DOUBLE PRECISION NOT NULL DEFAULT 1,
      "unitPrice"      DOUBLE PRECISION NOT NULL DEFAULT 0,
      total            DOUBLE PRECISION NOT NULL DEFAULT 0,
      "organizationId" TEXT NOT NULL,
      "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})

  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_invoiceitem_invoice" ON "InvoiceItem" ("invoiceId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_invoiceitem_org" ON "InvoiceItem" ("organizationId")`).catch(() => {})

  _ensured = true
}