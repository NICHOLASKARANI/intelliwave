export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { ensureFixedAssetSchema } from '@/lib/wavecore/fixed-assets-schema'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

async function nextCode(orgId: string): Promise<string> {
  const r = await pool.query(
    `SELECT code FROM "FixedAsset"
     WHERE "organizationId" = $1 AND code LIKE 'FA-%'
     ORDER BY code DESC LIMIT 1`,
    [orgId]
  )
  if (r.rowCount === 0) return 'FA-0001'
  const last = String(r.rows[0].code).replace(/^FA-/, '')
  const n = parseInt(last, 10)
  return 'FA-' + String((isNaN(n) ? 0 : n) + 1).padStart(4, '0')
}

/**
 * GET /api/wavecore/finance/assets
 * List all fixed assets for the org. Optional filters: ?status=, ?category=
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let sql = `SELECT * FROM "FixedAsset" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    if (status) { params.push(status); sql += ` AND status = $${params.length}` }
    if (category) { params.push(category); sql += ` AND category = $${params.length}` }
    sql += ` ORDER BY "purchaseDate" DESC, code ASC`

    const r = await pool.query(sql, params)

    const assets = r.rows.map((a: any) => ({
      ...a,
      purchaseCost: Number(a.purchaseCost || 0),
      residualValue: Number(a.residualValue || 0),
      accumulatedDepreciation: Number(a.accumulatedDepreciation || 0),
      bookValue: round2(Number(a.purchaseCost || 0) - Number(a.accumulatedDepreciation || 0)),
    }))

    const totals = {
      count: assets.length,
      cost: round2(assets.reduce((s: number, a: any) => s + a.purchaseCost, 0)),
      accumulated: round2(assets.reduce((s: number, a: any) => s + a.accumulatedDepreciation, 0)),
      bookValue: round2(assets.reduce((s: number, a: any) => s + a.bookValue, 0)),
    }

    return NextResponse.json({ assets, totals })
  } catch (error) {
    console.error('[fixed-assets GET]', error)
    return NextResponse.json({ assets: [], totals: {}, error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/finance/assets
 * Body: { name, category?, purchaseDate, purchaseCost, residualValue?,
 *         usefulLifeMonths, method?, assetAccountId?,
 *         depreciationExpenseAccountId?, accumulatedDepreciationAccountId? }
 * Creates a FixedAsset. code is auto-assigned (FA-####).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || !body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!body.purchaseDate) return NextResponse.json({ error: 'purchaseDate is required' }, { status: 400 })

    const purchaseDate = new Date(body.purchaseDate)
    if (isNaN(purchaseDate.getTime())) return NextResponse.json({ error: 'Invalid purchaseDate' }, { status: 400 })

    const purchaseCost = round2(Number(body.purchaseCost || 0))
    const residualValue = round2(Number(body.residualValue || 0))
    const usefulLifeMonths = parseInt(body.usefulLifeMonths || 0)
    const method = (body.method === 'DECLINING' ? 'DECLINING' : 'STRAIGHT_LINE')

    if (purchaseCost <= 0) return NextResponse.json({ error: 'purchaseCost must be > 0' }, { status: 400 })
    if (residualValue < 0 || residualValue >= purchaseCost) {
      return NextResponse.json({ error: 'residualValue must be >= 0 and < purchaseCost' }, { status: 400 })
    }
    if (usefulLifeMonths <= 0 || usefulLifeMonths > 600) {
      return NextResponse.json({ error: 'usefulLifeMonths must be between 1 and 600' }, { status: 400 })
    }

    const code = await nextCode(orgId)
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const r = await pool.query(
      `INSERT INTO "FixedAsset"
         (id, code, name, category, "purchaseDate", "purchaseCost", "residualValue",
          "usefulLifeMonths", method, "accumulatedDepreciation", status,
          "assetAccountId", "depreciationExpenseAccountId", "accumulatedDepreciationAccountId",
          "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,'ACTIVE',$10,$11,$12,$13,NOW(),NOW())
       RETURNING *`,
      [
        id, code, String(body.name).trim(), body.category || null, purchaseDate,
        purchaseCost, residualValue, usefulLifeMonths, method,
        body.assetAccountId || null,
        body.depreciationExpenseAccountId || null,
        body.accumulatedDepreciationAccountId || null,
        orgId,
      ]
    )

    return NextResponse.json({ asset: r.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[fixed-assets POST]', error)
    return NextResponse.json({ error: 'Failed to create: ' + (error as Error).message }, { status: 500 })
  }
}