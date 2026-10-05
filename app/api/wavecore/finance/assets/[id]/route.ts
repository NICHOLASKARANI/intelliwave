export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { ensureFixedAssetSchema } from '@/lib/wavecore/fixed-assets-schema'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/**
 * PATCH /api/wavecore/finance/assets/[id]
 * Body: { name?, category?, usefulLifeMonths?, residualValue?, method?, status?, ... }
 * Updates editable fields. Cannot change code, purchaseCost, or accumulated
 * depreciation through this route — those are managed by create + depreciate.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const existing = await pool.query(
      `SELECT * FROM "FixedAsset" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (existing.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fields: string[] = []
    const values: any[] = []
    const push = (col: string, val: any) => { values.push(val); fields.push(`"${col}" = $${values.length}`) }

    if (typeof body.name === 'string' && body.name.trim()) push('name', body.name.trim())
    if (typeof body.category === 'string' || body.category === null) push('category', body.category || null)
    if (body.usefulLifeMonths != null) {
      const n = parseInt(body.usefulLifeMonths)
      if (n <= 0 || n > 600) return NextResponse.json({ error: 'Invalid usefulLifeMonths' }, { status: 400 })
      push('usefulLifeMonths', n)
    }
    if (body.residualValue != null) {
      const rv = round2(Number(body.residualValue))
      if (rv < 0) return NextResponse.json({ error: 'Invalid residualValue' }, { status: 400 })
      push('residualValue', rv)
    }
    if (body.method === 'STRAIGHT_LINE' || body.method === 'DECLINING') push('method', body.method)
    if (body.status === 'ACTIVE' || body.status === 'DISPOSED' || body.status === 'FULLY_DEPRECIATED') push('status', body.status)
    if (body.disposalDate !== undefined) push('disposalDate', body.disposalDate ? new Date(body.disposalDate) : null)
    if (body.disposalProceeds !== undefined) push('disposalProceeds', body.disposalProceeds == null ? null : round2(Number(body.disposalProceeds)))
    if (body.assetAccountId !== undefined) push('assetAccountId', body.assetAccountId || null)
    if (body.depreciationExpenseAccountId !== undefined) push('depreciationExpenseAccountId', body.depreciationExpenseAccountId || null)
    if (body.accumulatedDepreciationAccountId !== undefined) push('accumulatedDepreciationAccountId', body.accumulatedDepreciationAccountId || null)

    if (fields.length === 0) return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 })

    values.push(params.id, orgId)
    const sql = `UPDATE "FixedAsset" SET ${fields.join(', ')}, "updatedAt" = NOW()
                 WHERE id = $${values.length - 1} AND "organizationId" = $${values.length}
                 RETURNING *`

    const r = await pool.query(sql, values)
    return NextResponse.json({ asset: r.rows[0] })
  } catch (error) {
    console.error('[fixed-assets PATCH]', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

/**
 * DELETE /api/wavecore/finance/assets/[id]
 * Refuses to delete an asset that has any accumulated depreciation or
 * posted journal entries. Disposal is the correct path for those.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()
    const orgId = session.organizationId

    const existing = await pool.query(
      `SELECT "accumulatedDepreciation" AS acc FROM "FixedAsset"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (existing.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (Number(existing.rows[0].acc || 0) > 0) {
      return NextResponse.json({
        error: 'Cannot delete: this asset has accumulated depreciation. Mark it DISPOSED instead.',
      }, { status: 409 })
    }

    await pool.query(
      `DELETE FROM "FixedAsset" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[fixed-assets DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}