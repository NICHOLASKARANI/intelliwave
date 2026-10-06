/**
 * Idempotent WavveSignal schema bootstrap. Same pattern as
 * lib/wavecore/fixed-assets-schema.ts — CREATE TABLE IF NOT EXISTS
 * on first touch, cached per-process.
 */
import { pool } from '@/lib/wavecore/db'

let _ensured = false

export async function ensureWavveSignalSchema(): Promise<void> {
  if (_ensured) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WavveSignal" (
      id              TEXT PRIMARY KEY,
      pair            TEXT NOT NULL,
      direction       TEXT NOT NULL DEFAULT 'NO_TRADE',
      tier            TEXT NOT NULL DEFAULT 'NO_TRADE',
      score           INTEGER NOT NULL DEFAULT 0,
      entry           DOUBLE PRECISION,
      stopLoss        DOUBLE PRECISION,
      takeProfit1     DOUBLE PRECISION,
      takeProfit2     DOUBLE PRECISION,
      riskReward      DOUBLE PRECISION,
      reason          JSONB,
      generatedAt     TIMESTAMP NOT NULL DEFAULT NOW(),
      signalDate      DATE NOT NULL,
      organizationId  TEXT NOT NULL
    )
  `).catch(() => {})

  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_wavvesignal_org" ON "WavveSignal" ("organizationId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_wavvesignal_org_pair" ON "WavveSignal" ("organizationId", pair)`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_wavvesignal_org_date" ON "WavveSignal" ("organizationId", "signalDate")`).catch(() => {})
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uniq_wavvesignal_org_pair_date" ON "WavveSignal" ("organizationId", pair, "signalDate")`).catch(() => {})

  _ensured = true
}

export interface WavveSignal {
  id: string
  pair: string
  direction: 'BUY' | 'SELL' | 'NO_TRADE'
  tier: 'NO_TRADE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'HIGH' | 'VERY_HIGH'
  score: number
  entry: number | null
  stopLoss: number | null
  takeProfit1: number | null
  takeProfit2: number | null
  riskReward: number | null
  reason: Record<string, any>
  generatedAt: string
  signalDate: string
  organizationId: string
}