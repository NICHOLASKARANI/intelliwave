export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const strategy = searchParams.get('strategy') || 'FEFO'

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get batches sorted by strategy
    let orderBy = '"expiryDate" ASC' // FEFO default
    if (strategy === 'FIFO') orderBy = '"manufacturingDate" ASC'
    if (strategy === 'LIFO') orderBy = '"manufacturingDate" DESC'

    const result = await pool.query(`
      SELECT * FROM "Batch"
      WHERE "productId" = $1 AND "organizationId" = $2
        AND "remainingQuantity" > 0
      ORDER BY ${orderBy}
    `, [productId, session.organizationId]).catch(() => ({ rows: [] }))

    const issueOrder = result.rows.map((batch, index) => ({
      order: index + 1,
      batchNumber: batch.batchNumber,
      remainingQuantity: batch.remainingQuantity,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      qualityStatus: batch.qualityStatus,
      binLocation: batch.binLocation,
      daysToExpiry: batch.expiryDate ? Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    }))

    return NextResponse.json({ 
      strategy,
      issueOrder,
      totalQuantity: issueOrder.reduce((sum, b) => sum + Number(b.remainingQuantity || 0), 0)
    })
  } catch (error) {
    console.error('FEFO/FIFO error:', error)
    return NextResponse.json({ strategy, issueOrder: [], totalQuantity: 0 })
  }
}