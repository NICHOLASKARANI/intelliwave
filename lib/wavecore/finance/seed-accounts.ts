/**
 * Seed the 18 standard Chart of Accounts for a new organization.
 *
 * Idempotent: uses WHERE NOT EXISTS so it can safely run on orgs that
 * already have some/all accounts. Never overwrites existing accounts.
 *
 * Called from:
 *   - auth/signup (inside the signup transaction, so org+accounts commit together)
 *   - any future admin "seed accounts" action
 */

import type { PoolClient } from 'pg'

interface StandardAccount {
  code: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
}

const STANDARD_ACCOUNTS: StandardAccount[] = [
  { code: '1000', name: 'Cash',                  type: 'ASSET' },
  { code: '1100', name: 'Bank Account',          type: 'ASSET' },
  { code: '1200', name: 'Accounts Receivable',   type: 'ASSET' },
  { code: '1300', name: 'Inventory',             type: 'ASSET' },
  { code: '1400', name: 'Fixed Assets',          type: 'ASSET' },
  { code: '2000', name: 'Accounts Payable',      type: 'LIABILITY' },
  { code: '2100', name: 'VAT Payable',           type: 'LIABILITY' },
  { code: '2200', name: 'PAYE Payable',          type: 'LIABILITY' },
  { code: '3000', name: 'Owner Equity',          type: 'EQUITY' },
  { code: '3100', name: 'Retained Earnings',     type: 'EQUITY' },
  { code: '4000', name: 'Sales Revenue',         type: 'INCOME' },
  { code: '4100', name: 'Service Revenue',       type: 'INCOME' },
  { code: '5000', name: 'Cost of Goods Sold',    type: 'EXPENSE' },
  { code: '6000', name: 'Salaries & Wages',      type: 'EXPENSE' },
  { code: '6100', name: 'Rent Expense',          type: 'EXPENSE' },
  { code: '6200', name: 'Utilities',             type: 'EXPENSE' },
  { code: '6300', name: 'Marketing',             type: 'EXPENSE' },
  { code: '6400', name: 'Office Supplies',       type: 'EXPENSE' },
]

/**
 * Seed standard accounts for one organization, inside a caller-owned transaction.
 * Throws on failure — caller's transaction rolls back.
 */
export async function seedStandardAccounts(
  client: PoolClient,
  organizationId: string
): Promise<{ seeded: number }> {
  let seeded = 0
  for (const acct of STANDARD_ACCOUNTS) {
    const res = await client.query(
      `INSERT INTO "ChartOfAccount"
         (id, "organizationId", code, name, type, "isActive", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, $1, $2, $3, $4::"AccountType", true, NOW(), NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM "ChartOfAccount"
         WHERE "organizationId" = $1 AND code = $2
       )`,
      [organizationId, acct.code, acct.name, acct.type]
    )
    seeded += res.rowCount || 0
  }
  return { seeded }
}