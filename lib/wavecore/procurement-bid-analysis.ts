/**
 * Bid Analysis / Weighted Scoring Engine
 *
 * Pure function: given RFQ lines, supplier quotes, supplier metadata,
 * and evaluation weights, returns ranked suppliers with per-criterion
 * score breakdown and an award recommendation.
 *
 * No DB access. No HTTP. No side effects.
 */

export interface BidWeights {
  price: number
  leadTime: number
  rating: number
  coverage: number
}

export const DEFAULT_WEIGHTS: BidWeights = {
  price: 50,
  leadTime: 20,
  rating: 15,
  coverage: 15,
}

export interface EvaluationCriteria {
  weights?: Partial<BidWeights>
  preferredSuppliers?: string[]
}

export interface RFQLineRow {
  id: string
  quantity: number
}

export interface QuoteRow {
  id: string
  supplierId: string
  rfqLineId: string
  quantity: number
  unitPrice: number
  lineTotal: number
  leadTimeDays?: number | null
  status?: string
}

export interface SupplierRow {
  id: string
  name?: string | null
  legalName?: string | null
  rating?: number | null
}

export interface SupplierScore {
  supplierId: string
  supplierName: string
  totalQuoted: number
  leadTimeAvg: number
  coveragePct: number
  linesQuoted: number
  linesTotal: number
  scores: {
    price: number
    leadTime: number
    rating: number
    coverage: number
  }
  bonus: number
  finalScore: number
  rank: number
  isRecommended: boolean
}

export interface BidAnalysisResult {
  weights: BidWeights
  preferredSuppliers: string[]
  supplierCount: number
  lineCount: number
  ranking: SupplierScore[]
  recommendedSupplierId: string | null
  rationale: string
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function runBidAnalysis(
  rfqLines: RFQLineRow[],
  quotes: QuoteRow[],
  suppliersById: Map<string, SupplierRow>,
  criteria?: EvaluationCriteria
): BidAnalysisResult {
  const weights: BidWeights = {
    ...DEFAULT_WEIGHTS,
    ...(criteria?.weights || {}),
  }
  const preferred = new Set(criteria?.preferredSuppliers || [])

  const totalLines = rfqLines.length
  if (totalLines === 0) {
    return {
      weights,
      preferredSuppliers: Array.from(preferred),
      supplierCount: 0,
      lineCount: 0,
      ranking: [],
      recommendedSupplierId: null,
      rationale: 'RFQ has no line items to analyze',
    }
  }

  // Only consider SUBMITTED (or ACCEPTED / REJECTED) quotes — ignore DRAFT
  const usefulQuotes = quotes.filter(q => q.status !== 'DRAFT')

  // Group by supplier
  const bySupplier = new Map<string, { lines: QuoteRow[]; total: number; leadSum: number; leadCount: number }>()
  for (const q of usefulQuotes) {
    if (!bySupplier.has(q.supplierId)) {
      bySupplier.set(q.supplierId, { lines: [], total: 0, leadSum: 0, leadCount: 0 })
    }
    const b = bySupplier.get(q.supplierId)!
    b.lines.push(q)
    b.total += Number(q.lineTotal || 0)
    if (q.leadTimeDays != null) {
      b.leadSum += Number(q.leadTimeDays)
      b.leadCount += 1
    }
  }

  if (bySupplier.size === 0) {
    return {
      weights,
      preferredSuppliers: Array.from(preferred),
      supplierCount: 0,
      lineCount: totalLines,
      ranking: [],
      recommendedSupplierId: null,
      rationale: 'No submitted quotes yet',
    }
  }

  // Determine bests for relative scoring
  const totals = Array.from(bySupplier.values()).map(b => b.total).filter(t => t > 0)
  const minTotal = Math.min(...totals)

  const leadAverages: number[] = []
  for (const b of bySupplier.values()) {
    if (b.leadCount > 0) leadAverages.push(b.leadSum / b.leadCount)
  }
  const minLead = leadAverages.length > 0 ? Math.min(...leadAverages) : 0

  const weightSum =
    (weights.price + weights.leadTime + weights.rating + weights.coverage) || 100

  // Score each supplier
  const scored: SupplierScore[] = []
  for (const [supplierId, bucket] of bySupplier.entries()) {
    const supplier = suppliersById.get(supplierId)
    const name = supplier?.name || supplier?.legalName || 'Unknown supplier'

    // Price score
    const priceScore = bucket.total > 0 ? clamp((minTotal / bucket.total) * 100) : 0

    // Lead time score
    const avgLead = bucket.leadCount > 0 ? bucket.leadSum / bucket.leadCount : 0
    const leadScore = avgLead > 0 && minLead > 0 ? clamp((minLead / avgLead) * 100) : 100

    // Rating score — normalize 0–5 → 0–100, or if already 0–100 pass through
    let ratingRaw = Number(supplier?.rating || 0)
    if (ratingRaw <= 5) ratingRaw = (ratingRaw / 5) * 100
    const ratingScore = clamp(ratingRaw)

    // Coverage — how many distinct RFQ lines are quoted
    const distinctLines = new Set(bucket.lines.map(l => l.rfqLineId)).size
    const coverageScore = clamp((distinctLines / totalLines) * 100)

    // Weighted sum
    const weighted =
      (priceScore * weights.price +
        leadScore * weights.leadTime +
        ratingScore * weights.rating +
        coverageScore * weights.coverage) / weightSum

    const bonus = preferred.has(supplierId) ? 10 : 0
    const finalScore = clamp(weighted + bonus)

    scored.push({
      supplierId,
      supplierName: name,
      totalQuoted: round2(bucket.total),
      leadTimeAvg: bucket.leadCount > 0 ? Math.round(bucket.leadSum / bucket.leadCount) : 0,
      coveragePct: round2(coverageScore),
      linesQuoted: distinctLines,
      linesTotal: totalLines,
      scores: {
        price: round2(priceScore),
        leadTime: round2(leadScore),
        rating: round2(ratingScore),
        coverage: round2(coverageScore),
      },
      bonus,
      finalScore: round2(finalScore),
      rank: 0,
      isRecommended: false,
    })
  }

  // Sort: highest score, then lowest total
  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore
    return a.totalQuoted - b.totalQuoted
  })

  scored.forEach((s, i) => { s.rank = i + 1 })
  if (scored.length > 0) scored[0].isRecommended = true

  const winner = scored[0]
  const rationale = winner
    ? `${winner.supplierName} ranks #1 with score ${winner.finalScore} ` +
      `(price ${winner.scores.price}, lead ${winner.scores.leadTime}, ` +
      `rating ${winner.scores.rating}, coverage ${winner.scores.coverage}` +
      `${winner.bonus > 0 ? ', +' + winner.bonus + ' preferred' : ''})`
    : 'No suppliers to recommend'

  return {
    weights,
    preferredSuppliers: Array.from(preferred),
    supplierCount: scored.length,
    lineCount: totalLines,
    ranking: scored,
    recommendedSupplierId: winner?.supplierId || null,
    rationale,
  }
}