/**
 * Idempotent FixedAsset schema bootstrap.
 *
 * The production DB has drifted from schema.prisma (many tables exist in
 * the runtime DB that aren't declared in Prisma). This helper uses
 * CREATE TABLE IF NOT EXISTS so the FixedAsset table exists the first
 * time any finance/asset route runs — no Prisma migration required.
 *
 * Called by every /api/wavecore/finance/assets/* route on entry. Cached
 * per-process after the first successful call.
 */
import { pool } from '@/lib/wavecore/db'

let _ensured = false

export async function ensureFixedAssetSchema(): Promise<void> {
  if (_ensured) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "FixedAsset" (
      id                                TEXT PRIMARY KEY,
      code                              TEXT NOT NULL,
      name                              TEXT NOT NULL,
      category                          TEXT,
      "purchaseDate"                    TIMESTAMP NOT NULL,
      "purchaseCost"                    DOUBLE PRECISION NOT NULL DEFAULT 0,
      "residualValue"                   DOUBLE PRECISION NOT NULL DEFAULT 0,
      "usefulLifeMonths"                INTEGER NOT NULL DEFAULT 12,
      method                            TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
      "accumulatedDepreciation"         DOUBLE PRECISION NOT NULL DEFAULT 0,
      "lastDepreciatedAt"               TIMESTAMP,
      status                            TEXT NOT NULL DEFAULT 'ACTIVE',
      "disposalDate"                    TIMESTAMP,
      "disposalProceeds"                DOUBLE PRECISION,
      "assetAccountId"                  TEXT,
      "depreciationExpenseAccountId"    TEXT,
      "accumulatedDepreciationAccountId" TEXT,
      "organizationId"                  TEXT NOT NULL,
      "createdAt"                       TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt"                       TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})

  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_fixedasset_org" ON "FixedAsset" ("organizationId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_fixedasset_org_status" ON "FixedAsset" ("organizationId", status)`).catch(() => {})
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uniq_fixedasset_org_code" ON "FixedAsset" ("organizationId", code)`).catch(() => {})

  _ensured = true
}

export interface FixedAsset {
  id: string
  code: string
  name: string
  category: string | null
  purchaseDate: string
  purchaseCost: number
  residualValue: number
  usefulLifeMonths: number
  method: 'STRAIGHT_LINE' | 'DECLINING'
  accumulatedDepreciation: number
  lastDepreciatedAt: string | null
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED'
  disposalDate: string | null
  disposalProceeds: number | null
  assetAccountId: string | null
  depreciationExpenseAccountId: string | null
  accumulatedDepreciationAccountId: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}