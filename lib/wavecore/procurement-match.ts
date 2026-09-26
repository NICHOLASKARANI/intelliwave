/**
 * 3-Way Match engine — PO ↔ GRN ↔ Supplier Invoice
 *
 * Pure function: given already-fetched rows, computes per-line match
 * results + overall verdict. No DB access here.
 *
 * Tolerances (edit here to change org-wide policy):
 */
export const QTY_TOLERANCE        = 0.01     // units
export const AMOUNT_TOLERANCE_PCT = 0.02     // 2%
export const AMOUNT_TOLERANCE_ABS = 100      // KES

export type LineVerdict = 'MATCHED' | 'PARTIAL' | 'EXCEPTION' | 'UNMATCHED'
export type OverallVerdict = 'AUTO_MATCHED' | 'PARTIAL' | 'EXCEPTION' | 'UNMATCHED'

export interface PoItemRow {
  id: string
  description?: string
  quantity: number
  unitPrice: number
  taxRate?: number
  receivedQty?: number
  productId?: string | null
}

export interface GrnLineRow {
  id: string
  purchaseOrderItemId: string | null
  description?: string
  receivedQty: number
  rejectedQty: number
  damagedQty: number
  unitPrice: number
  taxRate?: number
}

export interface InvoiceLineRow {
  id: string
  lineNumber?: number
  description?: string
  purchaseOrderItemId: string | null
  goodsReceiptLineId: string | null
  quantity: number
  unitPrice: number
  taxRate?: number
  lineTotal: number
}

export interface LineMatchResult {
  lineId: string
  lineNumber?: number
  description?: string
  verdict: LineVerdict
  matchedQty: number
  matchedAmount: number
  invoiceAmount: number
  poAmount: number | null
  grnAmount: number | null
  qtyVariance: number
  amountVariance: number
  notes: string
}

export interface MatchResult {
  perLine: LineMatchResult[]
  overall: OverallVerdict
  summary: string
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function runThreeWayMatch(
  poItems: PoItemRow[],
  grnLines: GrnLineRow[],
  invoiceLines: InvoiceLineRow[]
): MatchResult {
  const poById = new Map<string, PoItemRow>()
  for (const p of poItems) poById.set(p.id, p)

  // Group GRN lines by PO item id (a PO item can be received across multiple GRNs)
  const grnByPoItem = new Map<string, GrnLineRow[]>()
  for (const g of grnLines) {
    if (!g.purchaseOrderItemId) continue
    const arr = grnByPoItem.get(g.purchaseOrderItemId) || []
    arr.push(g)
    grnByPoItem.set(g.purchaseOrderItemId, arr)
  }

  const perLine: LineMatchResult[] = []

  for (const inv of invoiceLines) {
    const invAmount = round2(
      Number(inv.quantity) * Number(inv.unitPrice) * (1 + (Number(inv.taxRate) || 0) / 100)
    )

    // No PO reference → cannot match
    if (!inv.purchaseOrderItemId || !poById.has(inv.purchaseOrderItemId)) {
      perLine.push({
        lineId: inv.id,
        lineNumber: inv.lineNumber,
        description: inv.description,
        verdict: 'UNMATCHED',
        matchedQty: 0,
        matchedAmount: 0,
        invoiceAmount: invAmount,
        poAmount: null,
        grnAmount: null,
        qtyVariance: 0,
        amountVariance: 0,
        notes: 'No PO line reference — cannot 3-way match',
      })
      continue
    }

    const po = poById.get(inv.purchaseOrderItemId)!
    const poAmount = round2(Number(po.quantity) * Number(po.unitPrice))

    // Find GRN accepted quantity for this PO item
    const grnRows = grnByPoItem.get(po.id) || []
    const grnAccepted = grnRows.reduce((sum, g) => {
      const accepted = Math.max(0,
        Number(g.receivedQty || 0) - Number(g.rejectedQty || 0) - Number(g.damagedQty || 0)
      )
      return sum + accepted * Number(g.unitPrice || 0)
    }, 0)
    const grnAcceptedQty = grnRows.reduce((sum, g) => {
      const accepted = Math.max(0,
        Number(g.receivedQty || 0) - Number(g.rejectedQty || 0) - Number(g.damagedQty || 0)
      )
      return sum + accepted
    }, 0)

    const grnAmount = round2(grnAccepted)

    // If GRN not present → PARTIAL (not received yet)
    if (grnRows.length === 0) {
      perLine.push({
        lineId: inv.id,
        lineNumber: inv.lineNumber,
        description: inv.description,
        verdict: 'PARTIAL',
        matchedQty: 0,
        matchedAmount: 0,
        invoiceAmount: invAmount,
        poAmount,
        grnAmount: 0,
        qtyVariance: Number(inv.quantity),
        amountVariance: invAmount,
        notes: 'No goods receipt found for this PO line — not received yet',
      })
      continue
    }

    const invQty = Number(inv.quantity)
    const qtyVar = round2(invQty - grnAcceptedQty)
    const amtVar = round2(invAmount - grnAmount)
    const absTol = Math.max(AMOUNT_TOLERANCE_ABS, Math.abs(grnAmount) * AMOUNT_TOLERANCE_PCT)

    const qtyOk = Math.abs(qtyVar) <= QTY_TOLERANCE
    const amtOk = Math.abs(amtVar) <= absTol

    if (qtyOk && amtOk) {
      perLine.push({
        lineId: inv.id,
        lineNumber: inv.lineNumber,
        description: inv.description,
        verdict: 'MATCHED',
        matchedQty: invQty,
        matchedAmount: invAmount,
        invoiceAmount: invAmount,
        poAmount,
        grnAmount,
        qtyVariance: qtyVar,
        amountVariance: amtVar,
        notes: 'Within tolerance',
      })
    } else {
      const parts: string[] = []
      if (!qtyOk) parts.push(`Qty variance ${qtyVar} units`)
      if (!amtOk) parts.push(`Amount variance ${amtVar} (tolerance ±${round2(absTol)})`)
      perLine.push({
        lineId: inv.id,
        lineNumber: inv.lineNumber,
        description: inv.description,
        verdict: 'EXCEPTION',
        matchedQty: grnAcceptedQty,
        matchedAmount: grnAmount,
        invoiceAmount: invAmount,
        poAmount,
        grnAmount,
        qtyVariance: qtyVar,
        amountVariance: amtVar,
        notes: parts.join(' · ') || 'Variance detected',
      })
    }
  }

  // Overall verdict
  const total = perLine.length
  const matched = perLine.filter(l => l.verdict === 'MATCHED').length
  const exception = perLine.filter(l => l.verdict === 'EXCEPTION').length
  const unmatched = perLine.filter(l => l.verdict === 'UNMATCHED').length

  let overall: OverallVerdict
  let summary: string
  if (exception > 0) {
    overall = 'EXCEPTION'
    summary = `${exception} of ${total} line(s) exceed tolerance`
  } else if (unmatched === total) {
    overall = 'UNMATCHED'
    summary = 'No lines reference a PO'
  } else if (matched === total) {
    overall = 'AUTO_MATCHED'
    summary = `All ${total} line(s) matched within tolerance`
  } else {
    overall = 'PARTIAL'
    summary = `${matched} of ${total} line(s) matched; rest awaiting receipt or partial`
  }

  return { perLine, overall, summary }
}