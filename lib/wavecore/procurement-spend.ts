/**
 * Spend Analytics — pure aggregation helpers.
 *
 * Takes already-fetched raw rows and computes grouped metrics for the
 * procurement dashboard. No DB access, no HTTP, no side effects.
 */

export type SpendDimension = 'supplier' | 'category' | 'month' | 'status' | 'currency'

export interface RawInvoiceRow {
  id: string
  supplierId: string | null
  supplierName: string | null
  currency: string | null
  total: number
  status: string | null
  invoiceDate: string | null
  createdAt: string | null
  poCategory?: string | null
}

export interface SpendBucket {
  key: string
  label: string
  totalSpend: number
  invoiceCount: number
  avgInvoice: number
  sharePct: number
}

export interface SpendAnalyticsResult {
  dimension: SpendDimension
  fromDate: string | null
  toDate: string | null
  totalSpend: number
  rowCount: number
  buckets: SpendBucket[]
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function bucketKey(row: RawInvoiceRow, dim: SpendDimension): { key: string; label: string } {
  switch (dim) {
    case 'supplier':
      return {
        key: row.supplierId || 'unknown',
        label: row.supplierName || 'Unknown supplier',
      }
    case 'category':
      return {
        key: row.poCategory || row.poCategory || 'UNCATEGORIZED',
        label: (row.poCategory || row.poCategory || 'Uncategorized'),
      }
    case 'month': {
      const d = row.invoiceDate || row.createdAt
      if (!d) return { key: 'unknown', label: 'Unknown' }
      const dt = new Date(d)
      const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`
      const label = dt.toLocaleString('en-GB', { month: 'short', year: 'numeric' })
      return { key, label }
    }
    case 'status':
      return {
        key: row.status || 'UNKNOWN',
        label: row.status || 'Unknown',
      }
    case 'currency':
      return {
        key: row.currency || 'KES',
        label: row.currency || 'KES',
      }
  }
}

export function computeSpendAnalytics(
  rows: RawInvoiceRow[],
  dimension: SpendDimension,
  fromDate?: string | null,
  toDate?: string | null,
  limit = 20
): SpendAnalyticsResult {
  const totalSpend = rows.reduce((s, r) => s + Number(r.total || 0), 0)

  const map = new Map<string, { label: string; totalSpend: number; count: number }>()
  for (const r of rows) {
    const { key, label } = bucketKey(r, dimension)
    if (!map.has(key)) map.set(key, { label, totalSpend: 0, count: 0 })
    const b = map.get(key)!
    b.totalSpend += Number(r.total || 0)
    b.count += 1
  }

  let buckets: SpendBucket[] = []
  for (const [key, b] of map.entries()) {
    buckets.push({
      key,
      label: b.label,
      totalSpend: round2(b.totalSpend),
      invoiceCount: b.count,
      avgInvoice: b.count > 0 ? round2(b.totalSpend / b.count) : 0,
      sharePct: totalSpend > 0 ? round2((b.totalSpend / totalSpend) * 100) : 0,
    })
  }

  if (dimension === 'month') {
    buckets.sort((a, b) => a.key.localeCompare(b.key))
  } else {
    buckets.sort((a, b) => b.totalSpend - a.totalSpend)
    if (limit > 0) buckets = buckets.slice(0, limit)
  }

  return {
    dimension,
    fromDate: fromDate || null,
    toDate: toDate || null,
    totalSpend: round2(totalSpend),
    rowCount: rows.length,
    buckets,
  }
}