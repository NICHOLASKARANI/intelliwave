export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

/**
 * Kenya 2026 statutory defaults. Used to seed an org's table on first
 * load, and as the fallback bands for orgs that never customize.
 */
const KENYA_2026_DEFAULTS = [
  // PAYE progressive bands (monthly)
  { code: 'PAYE_BAND_1', label: 'PAYE Band 1 (first KES 24,000)',     bandMin: 0,      bandMax: 24000,   rate: 0.10,   fixedAmount: 0, sortOrder: 10 },
  { code: 'PAYE_BAND_2', label: 'PAYE Band 2 (24,001 - 32,333)',     bandMin: 24000,  bandMax: 32333,   rate: 0.25,   fixedAmount: 0, sortOrder: 20 },
  { code: 'PAYE_BAND_3', label: 'PAYE Band 3 (32,334 - 500,000)',    bandMin: 32333,  bandMax: 500000,  rate: 0.30,   fixedAmount: 0, sortOrder: 30 },
  { code: 'PAYE_BAND_4', label: 'PAYE Band 4 (500,001 - 800,000)',   bandMin: 500000, bandMax: 800000,  rate: 0.325,  fixedAmount: 0, sortOrder: 40 },
  { code: 'PAYE_BAND_5', label: 'PAYE Band 5 (above 800,000)',       bandMin: 800000, bandMax: null,    rate: 0.35,   fixedAmount: 0, sortOrder: 50 },

  // Reliefs
  { code: 'PERSONAL_RELIEF',  label: 'Personal Relief (monthly)',    bandMin: 0, bandMax: null, rate: 0, fixedAmount: 2400, sortOrder: 60 },
  { code: 'INSURANCE_RELIEF', label: 'Insurance Relief (monthly)',   bandMin: 0, bandMax: null, rate: 0, fixedAmount: 0,    sortOrder: 70 },

  // NSSF tiers (2024 Act)
  { code: 'NSSF_TIER_1', label: 'NSSF Tier I (6% of first 7,000)',       bandMin: 0,     bandMax: 7000,  rate: 0.06, fixedAmount: 0, sortOrder: 80 },
  { code: 'NSSF_TIER_2', label: 'NSSF Tier II (6% of 7,001 - 36,000)',   bandMin: 7000,  bandMax: 36000, rate: 0.06, fixedAmount: 0, sortOrder: 90 },
  { code: 'NSSF_CEILING', label: 'NSSF total ceiling',                    bandMin: 0, bandMax: null, rate: 0, fixedAmount: 2160, sortOrder: 100 },

  // SHIF (Social Health Insurance Fund - replaced NHIF)
  { code: 'SHIF_RATE', label: 'SHIF rate (2.75% of gross)', bandMin: 0, bandMax: null, rate: 0.0275, fixedAmount: 0, sortOrder: 110 },

  // Housing Levy
  { code: 'HOUSING_LEVY_RATE', label: 'Affordable Housing Levy (1.5%)', bandMin: 0, bandMax: null, rate: 0.015, fixedAmount: 0, sortOrder: 120 },
]

async function ensureStatutoryTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "StatutoryRate" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "bandMin" DOUBLE PRECISION DEFAULT 0,
      "bandMax" DOUBLE PRECISION,
      "rate" DOUBLE PRECISION DEFAULT 0,
      "fixedAmount" DOUBLE PRECISION DEFAULT 0,
      "sortOrder" INTEGER DEFAULT 0,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StatutoryRate_pkey" PRIMARY KEY ("id")
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_statutory_org" ON "StatutoryRate" ("organizationId")`).catch(() => {})
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uniq_statutory_org_code" ON "StatutoryRate" ("organizationId", "code")`).catch(() => {})
}

async function seedDefaults(orgId: string) {
  const crypto = require('crypto')
  for (const row of KENYA_2026_DEFAULTS) {
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "StatutoryRate"
         (id, "organizationId", code, label, "bandMin", "bandMax", rate, "fixedAmount", "sortOrder", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       ON CONFLICT ("organizationId", "code") DO NOTHING`,
      [id, orgId, row.code, row.label, row.bandMin, row.bandMax, row.rate, row.fixedAmount, row.sortOrder]
    ).catch(() => {})
  }
}

/**
 * GET /api/wavecore/hr/statutory
 * Returns this org's statutory bands. Seeds defaults on first load.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_PAYROLL')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    await ensureStatutoryTable()
    await seedDefaults(orgId)

    const r = await pool.query(
      `SELECT id, code, label, "bandMin", "bandMax", rate, "fixedAmount", "sortOrder", notes
       FROM "StatutoryRate"
       WHERE "organizationId" = $1
       ORDER BY "sortOrder" ASC`,
      [orgId]
    )

    return NextResponse.json({ bands: r.rows, defaults: KENYA_2026_DEFAULTS })
  } catch (error) {
    console.error('[statutory GET]', error)
    return NextResponse.json({ bands: [], error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/hr/statutory
 * Body: { bands: [{ code, label, bandMin, bandMax, rate, fixedAmount, sortOrder }] }
 * Upserts each band. Only the caller's org is touched.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_PAYROLL')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    await ensureStatutoryTable()

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.bands)) {
      return NextResponse.json({ error: 'bands array required' }, { status: 400 })
    }

    const crypto = require('crypto')
    let saved = 0
    for (const b of body.bands) {
      if (!b.code) continue
      const id = crypto.randomUUID()
      await pool.query(
        `INSERT INTO "StatutoryRate"
           (id, "organizationId", code, label, "bandMin", "bandMax", rate, "fixedAmount", "sortOrder", notes, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
         ON CONFLICT ("organizationId", "code") DO UPDATE SET
           label = EXCLUDED.label,
           "bandMin" = EXCLUDED."bandMin",
           "bandMax" = EXCLUDED."bandMax",
           rate = EXCLUDED.rate,
           "fixedAmount" = EXCLUDED."fixedAmount",
           "sortOrder" = EXCLUDED."sortOrder",
           notes = EXCLUDED.notes,
           "updatedAt" = NOW()`,
        [
          id, orgId, b.code,
          b.label || b.code,
          Number(b.bandMin || 0),
          b.bandMax === null || b.bandMax === undefined || b.bandMax === '' ? null : Number(b.bandMax),
          Number(b.rate || 0),
          Number(b.fixedAmount || 0),
          Number(b.sortOrder || 0),
          b.notes || null,
        ]
      )
      saved++
    }

    return NextResponse.json({ success: true, saved })
  } catch (error) {
    console.error('[statutory POST]', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

/**
 * POST with action=reset — wipe the org's bands and re-seed defaults.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_PAYROLL')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    await ensureStatutoryTable()
    await pool.query(`DELETE FROM "StatutoryRate" WHERE "organizationId" = $1`, [orgId])
    await seedDefaults(orgId)
    return NextResponse.json({ success: true, reset: true })
  } catch (error) {
    console.error('[statutory PUT]', error)
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 })
  }
}