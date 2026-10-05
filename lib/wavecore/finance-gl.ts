/**
 * WaveCore Finance — General Ledger computation helpers.
 *
 * The Chart of Accounts never stores a running balance. Balances are
 * always derived from JournalItem rows: for each account, sum(debit) -
 * sum(credit), optionally filtered by date or fiscal period.
 *
 * Account type normalisation: ChartOfAccount.type is an enum with the
 * values ASSET / LIABILITY / EQUITY / INCOME / EXPENSE. Account
 * grouping for the balance sheet uses these.
 */

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'

export interface AccountRow {
  id: string
  code: string
  name: string
  type: string
  parentId?: string | null
  isActive?: boolean
}

export interface JournalItemRow {
  accountId: string
  debit: number
  credit: number
}

export interface AccountBalance {
  accountId: string
  code: string
  name: string
  type: string
  debit: number
  credit: number
  /** Signed balance: debit - credit. Positive = debit-heavy. */
  balance: number
  /** Balance expressed on the account's natural side. */
  natural: number
}

const normalise = (t: string): AccountType => {
  const u = (t || '').toUpperCase()
  if (u === 'REVENUE' || u === 'INCOME') return 'INCOME'
  if (u === 'ASSET') return 'ASSET'
  if (u === 'LIABILITY') return 'LIABILITY'
  if (u === 'EQUITY') return 'EQUITY'
  if (u === 'EXPENSE') return 'EXPENSE'
  return 'ASSET'
}

export const accountTypeOf = (t: string): AccountType => normalise(t)

/**
 * Compute per-account debit/credit totals from a set of journal items.
 */
export function aggregateByAccount(items: JournalItemRow[]): Map<string, { debit: number; credit: number }> {
  const map = new Map<string, { debit: number; credit: number }>()
  for (const it of items) {
    const cur = map.get(it.accountId) || { debit: 0, credit: 0 }
    cur.debit += Number(it.debit || 0)
    cur.credit += Number(it.credit || 0)
    map.set(it.accountId, cur)
  }
  return map
}

/**
 * Produce a full per-account balance list from raw journal items and
 * the chart of accounts.
 */
export function computeBalances(accounts: AccountRow[], items: JournalItemRow[]): AccountBalance[] {
  const agg = aggregateByAccount(items)
  return accounts.map(a => {
    const { debit, credit } = agg.get(a.id) || { debit: 0, credit: 0 }
    const raw = debit - credit
    const type = normalise(a.type)
    // Natural balance: debit-heavy accounts are natural when positive,
    // credit-heavy accounts flip sign.
    const natural = type === 'ASSET' || type === 'EXPENSE' ? raw : -raw
    return {
      accountId: a.id,
      code: a.code,
      name: a.name,
      type,
      debit: round2(debit),
      credit: round2(credit),
      balance: round2(raw),
      natural: round2(natural),
    }
  })
}

export function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/**
 * Trial Balance: every active account with debit/credit columns.
 * Debit column shows net debit balances; credit column shows net
 * credit balances. The two columns should equal.
 */
export function trialBalance(accounts: AccountRow[], items: JournalItemRow[]) {
  const rows = computeBalances(accounts, items).map(b => {
    const debitCol = b.balance > 0 ? b.balance : 0
    const creditCol = b.balance < 0 ? -b.balance : 0
    return {
      accountId: b.accountId,
      code: b.code,
      name: b.name,
      type: b.type,
      debit: round2(debitCol),
      credit: round2(creditCol),
    }
  })
  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0))
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0))
  return {
    rows,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    difference: round2(totalDebit - totalCredit),
  }
}

/**
 * Income statement from Revenue / Expense accounts.
 * Natural balances: Revenue is credit-heavy (so natural = credit - debit),
 * Expense is debit-heavy.
 */
export function incomeStatement(accounts: AccountRow[], items: JournalItemRow[]) {
  const balances = computeBalances(accounts, items)
  const income = balances.filter(b => b.type === 'INCOME' && b.natural !== 0)
  const expense = balances.filter(b => b.type === 'EXPENSE' && b.natural !== 0)
  const totalIncome = round2(income.reduce((s, b) => s + b.natural, 0))
  const totalExpense = round2(expense.reduce((s, b) => s + b.natural, 0))
  const netProfit = round2(totalIncome - totalExpense)
  return {
    income,
    expense,
    totalIncome,
    totalExpense,
    netProfit,
    isProfit: netProfit >= 0,
  }
}

/**
 * Balance sheet from Asset / Liability / Equity accounts.
 * Assets: natural = debit - credit.
 * Liabilities & Equity: natural = credit - debit.
 * Also includes current-period net profit as a component of equity.
 */
export function balanceSheet(accounts: AccountRow[], items: JournalItemRow[]) {
  const balances = computeBalances(accounts, items)
  const assets = balances.filter(b => b.type === 'ASSET')
  const liabilities = balances.filter(b => b.type === 'LIABILITY')
  const equity = balances.filter(b => b.type === 'EQUITY')

  const income = balances.filter(b => b.type === 'INCOME').reduce((s, b) => s + b.natural, 0)
  const expense = balances.filter(b => b.type === 'EXPENSE').reduce((s, b) => s + b.natural, 0)
  const netProfit = round2(income - expense)

  const totalAssets = round2(assets.reduce((s, b) => s + b.natural, 0))
  const totalLiabilities = round2(liabilities.reduce((s, b) => s + b.natural, 0))
  const totalEquityRaw = round2(equity.reduce((s, b) => s + b.natural, 0))
  const totalEquity = round2(totalEquityRaw + netProfit)

  return {
    assets,
    liabilities,
    equity,
    netProfit,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity: round2(totalLiabilities + totalEquity),
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    difference: round2(totalAssets - (totalLiabilities + totalEquity)),
  }
}