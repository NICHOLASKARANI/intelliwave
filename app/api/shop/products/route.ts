import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const store = searchParams.get('store') || 'wavvemarket'
  
  try {
    let res;
    if (store === 'all') {
      res = await pool.query('SELECT * FROM "ShopProduct" ORDER BY "createdAt" DESC')
    } else {
      res = await pool.query('SELECT * FROM "ShopProduct" WHERE store = $1 ORDER BY "createdAt" DESC', [store])
    }
    
    // Map the lowercase PostgreSQL columns back to the camelCase the frontend expects
    const products = res.rows.map(row => ({
      ...row,
      imageUrl: row.imageurl, // PostgreSQL lowercases to imageurl
      subCategory: row.subcategory, // PostgreSQL lowercases to subcategory
    }))

    return NextResponse.json({ products })
  } catch (error) {
    return NextResponse.json({ products: [], error: 'Fetch failed' }, { status: 500 })
  }
}