export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const store = searchParams.get('store') || 'wavvemarket'

  try {
    let res
    if (store === 'all') {
      res = await pool.query('SELECT * FROM "ShopProduct" ORDER BY "createdAt" DESC')
    } else {
      res = await pool.query(
        'SELECT * FROM "ShopProduct" WHERE store = $1 ORDER BY "createdAt" DESC',
        [store]
      )
    }

    // Database uses quoted camelCase columns, so rows already have
    // imageUrl and subCategory correctly cased. No mapping needed.
    return NextResponse.json({ products: res.rows })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ products: [], error: 'Fetch failed' }, { status: 500 })
  }
}