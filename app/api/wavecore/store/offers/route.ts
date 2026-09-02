export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Helper to ensure Offer table exists
async function ensureOfferTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Offer" (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE,
        title TEXT,
        description TEXT,
        "discountType" TEXT DEFAULT 'PERCENTAGE',
        "discountValue" DECIMAL(15,2) DEFAULT 0,
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        status TEXT DEFAULT 'ACTIVE',
        "productIds" TEXT,
        "organizationId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_offer_org" ON "Offer" ("organizationId")`)
    return true
  } catch (error) {
    console.error('Failed to create Offer table:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureOfferTable()

    const result = await pool.query(`
      SELECT *
      FROM "Offer"
      WHERE "organizationId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 100
    `, [session.organizationId])

    const offers = result.rows
    const activeOffers = offers.filter(o => o.status === 'ACTIVE').length
    const expiredOffers = offers.filter(o => o.status === 'EXPIRED').length
    const scheduledOffers = offers.filter(o => o.status === 'SCHEDULED').length
    const totalDiscount = offers.reduce((sum, o) => sum + Number(o.discountValue || 0), 0)

    return NextResponse.json({ 
      offers,
      stats: {
        totalOffers: offers.length,
        activeOffers,
        expiredOffers,
        scheduledOffers,
        totalDiscount
      }
    })
  } catch (error) {
    console.error('Offers GET error:', error)
    return NextResponse.json({ 
      offers: [], 
      stats: { totalOffers: 0, activeOffers: 0, expiredOffers: 0, scheduledOffers: 0, totalDiscount: 0 }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'OFR-' + Date.now().toString().slice(-8)

    await ensureOfferTable()

    const result = await pool.query(`
      INSERT INTO "Offer" (id, number, title, description, "discountType", "discountValue", "startDate", "endDate", status, "productIds", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      id, 
      number, 
      body.title || '', 
      body.description || '', 
      body.discountType || 'PERCENTAGE', 
      body.discountValue || 0, 
      body.startDate || null, 
      body.endDate || null, 
      body.status || 'ACTIVE', 
      body.productIds || '', 
      session.organizationId
    ])

    return NextResponse.json({ 
      offer: result.rows[0],
      message: 'Offer created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Offers POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }

    await ensureOfferTable()

    await pool.query(`DELETE FROM "Offer" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' })
  } catch (error) {
    console.error('Offers DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}