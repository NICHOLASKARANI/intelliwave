import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const store = searchParams.get('store') || 'wavvemarket'
  const res = await pool.query('SELECT * FROM "ShopProduct" WHERE store = $1 ORDER BY "createdAt" DESC', [store])
  return NextResponse.json({ products: res.rows })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const adminPassword = process.env.SHOP_ADMIN_PASSWORD

    if (body.password !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ShopProduct" (id, store, name, description, price, "imageUrl", category, "subCategory") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, body.store, body.name, body.description, body.price, body.imageUrl, body.category, body.subCategory]
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Product save error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}