import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const store = searchParams.get('store') || 'wavvemarket'
  
  const res = await pool.query('SELECT * FROM "ShopProduct" WHERE store = $1 ORDER BY "createdAt" DESC', [store])
  return NextResponse.json({ products: res.rows })
}