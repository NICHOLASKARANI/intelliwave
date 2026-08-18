import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT * FROM "MarketplaceCategory" ORDER BY "listingCount" DESC`
    )
    return NextResponse.json({ categories: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}