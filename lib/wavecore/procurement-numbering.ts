/**
 * WaveCore Procurement — Sequential Number Generator
 * --------------------------------------------------
 * Generates unique, human-readable identifiers like REQ-2026-0042.
 *
 * Uses a counter table (`ProcurementNumbering`) with atomic upsert via
 * `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` so concurrent
 * requests never collide.
 *
 * Numbering is scoped to (organizationId, prefix, year).
 *
 * Usage:
 *   const num = await nextProcurementNumber(pool, orgId, 'REQ')
 *   // -> "REQ-2026-0001"
 */

export type NumberPrefix = 'REQ' | 'RFQ' | 'PO' | 'GRN' | 'CON' | 'BID' | 'AUC' | 'INV'

/**
 * Returns the next sequential number for the given org + prefix.
 * Safe under concurrency.
 */
export async function nextProcurementNumber(
  pool: any,
  organizationId: string,
  prefix: NumberPrefix
): Promise<string> {
  const year = new Date().getFullYear()
  const scope = prefix + ':' + year

  // Atomic upsert — Postgres guarantees no two concurrent callers get the same value
  const result = await pool.query(
    `INSERT INTO "ProcurementNumbering" (id, "organizationId", scope, prefix, year, counter, "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 1, NOW())
     ON CONFLICT ("organizationId", scope)
     DO UPDATE SET counter = "ProcurementNumbering".counter + 1, "updatedAt" = NOW()
     RETURNING counter`,
    [organizationId, scope, prefix, year]
  )

  const seq = Number(result.rows[0]?.counter || 1)
  const padded = String(seq).padStart(4, '0')
  return prefix + '-' + year + '-' + padded
}

/**
 * Peek at the current counter without incrementing.
 * Useful for previews / UI hints.
 */
export async function peekProcurementNumber(
  pool: any,
  organizationId: string,
  prefix: NumberPrefix
): Promise<string> {
  const year = new Date().getFullYear()
  const scope = prefix + ':' + year
  const result = await pool.query(
    `SELECT counter FROM "ProcurementNumbering" WHERE "organizationId" = $1 AND scope = $2`,
    [organizationId, scope]
  )
  const next = Number(result.rows[0]?.counter || 0) + 1
  return prefix + '-' + year + '-' + String(next).padStart(4, '0')
}