export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const reason = searchParams.get('reason')

    let sql = `SELECT * FROM "ScrapRecord" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (search) {
      sql += ` AND ("productName" ILIKE $${idx} OR "workOrderNumber" ILIKE $${idx} OR notes ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (reason && reason !== 'ALL') {
      sql += ` AND reason = $${idx++}`
      params.push(reason)
    }
    sql += ` ORDER BY "scrapDate" DESC, "createdAt" DESC LIMIT 500`

    const rowsRes = await pool.query(sql, params)
    const records = rowsRes.rows.map(r => ({
      ...r,
      totalCost: Number(r.quantity || 0) * Number(r.unitCost || 0),
    }))

    const totalQty = records.reduce((s, r) => s + Number(r.quantity || 0), 0)
    const totalCost = records.reduce((s, r) => s + r.totalCost, 0)

    // Breakdown by reason
    const reasonMap: Record<string, { count: number; qty: number; cost: number }> = {}
    for (const r of records) {
      const key = r.reason || 'OTHER'
      if (!reasonMap[key]) reasonMap[key] = { count: 0, qty: 0, cost: 0 }
      reasonMap[key].count += 1
      reasonMap[key].qty += Number(r.quantity || 0)
      reasonMap[key].cost += r.totalCost
    }
    const byReason = Object.entries(reasonMap).map(([reason, v]) => ({ reason, ...v })).sort((a, b) => b.cost - a.cost)

    // Breakdown by product (top 5)
    const prodMap: Record<string, { count: number; qty: number; cost: number }> = {}
    for (const r of records) {
      const key = r.productName || 'Unknown'
      if (!prodMap[key]) prodMap[key] = { count: 0, qty: 0, cost: 0 }
      prodMap[key].count += 1
      prodMap[key].qty += Number(r.quantity || 0)
      prodMap[key].cost += r.totalCost
    }
    const byProduct = Object.entries(prodMap).map(([product, v]) => ({ product, ...v })).sort((a, b) => b.cost - a.cost).slice(0, 5)

    // This month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = records.filter(r => r.scrapDate && new Date(r.scrapDate) >= monthStart)
    const monthCost = thisMonth.reduce((s, r) => s + r.totalCost, 0)

    const topReason = byReason[0]?.reason || '—'
    const topProduct = byProduct[0]?.product || '—'

    const summary = {
      total: records.length,
      totalQty: Math.round(totalQty * 10) / 10,
      totalCost: Math.round(totalCost),
      thisMonthCost: Math.round(monthCost),
      thisMonthCount: thisMonth.length,
      avgCostPerEvent: records.length > 0 ? Math.round(totalCost / records.length) : 0,
      topReason,
      topProduct,
      reasons: byReason.length,
    }

    return NextResponse.json({ records, summary, byReason, byProduct })
  } catch (error) {
    console.error('Scrap GET error:', error)
    return NextResponse.json({ records: [], summary: {}, byReason: [], byProduct: [], error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.productName || !body.productName.trim()) return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    const qty = Number(body.quantity || 0)
    if (qty <= 0) return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "ScrapRecord"
        (id, "productName", "workOrderNumber", quantity, "unitCost", reason, "scrapDate", notes, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.productName.trim(),
        body.workOrderNumber || null,
        qty,
        Number(body.unitCost || 0),
        body.reason || 'DEFECT',
        body.scrapDate || new Date().toISOString(),
        body.notes || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ record: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Scrap POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await pool.query(`DELETE FROM "ScrapRecord" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}