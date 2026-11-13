export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// POST: bulk CSV import
// Body: { rows: [{ id?, sku?, title?, price?, stock? }] }
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const rows: any[] = Array.isArray(body.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ error: 'No rows' }, { status: 400 })
    if (rows.length > 1000) return NextResponse.json({ error: 'Max 1000 rows per import' }, { status: 400 })

    let updated = 0
    let notFound = 0
    let skipped = 0

    for (const row of rows) {
      const id = row.id ? parseInt(row.id, 10) : null
      const sku = (row.sku || '').toString().trim()

      if (!id && !sku) { skipped++; continue }

      // Find listing owned by this seller
      let findParams: any[]
      let findQuery: string
      if (id) {
        findQuery = `SELECT id FROM "MarketplaceListing" WHERE id = $1 AND "sellerId" = $2`
        findParams = [id, session.userId]
      } else {
        findQuery = `SELECT id FROM "MarketplaceListing" WHERE sku = $1 AND "sellerId" = $2 LIMIT 1`
        findParams = [sku, session.userId]
      }

      const findRes = await pool.query(findQuery, findParams)
      if (findRes.rows.length === 0) { notFound++; continue }

      const listingId = findRes.rows[0].id

      const sets: string[] = []
      const params: any[] = []
      let i = 1

      if (row.price !== undefined && row.price !== '') {
        const price = Math.max(0, Number(row.price) || 0)
        if (price > 0) { sets.push(`price = $${i++}`); params.push(price) }
      }
      if (row.stock !== undefined && row.stock !== '') {
        const stock = Math.max(0, parseInt(row.stock, 10) || 0)
        sets.push(`stock = $${i++}`); params.push(stock)
      }
      if (row.status !== undefined && ['ACTIVE', 'DRAFT', 'SUSPENDED'].includes(row.status)) {
        sets.push(`status = $${i++}`); params.push(row.status)
      }

      if (sets.length === 0) { skipped++; continue }
      sets.push(`"updatedAt" = NOW()`)
      params.push(listingId)

      await pool.query(
        `UPDATE "MarketplaceListing" SET ${sets.join(', ')} WHERE id = $${i}`,
        params
      )
      updated++
    }

    return NextResponse.json({
      success: true,
      updated,
      notFound,
      skipped,
      total: rows.length,
    })
  } catch (error: any) {
    console.error('Bulk CSV error:', error?.message)
    return NextResponse.json({ error: 'Failed: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}