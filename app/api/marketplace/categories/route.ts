export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: List categories
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT * FROM "MarketplaceCategory" ORDER BY "listingCount" DESC, name ASC`
    )
    return NextResponse.json({ categories: result.rows })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ categories: [] })
  }
}

// POST: Create category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await pool.query(
      `INSERT INTO "MarketplaceCategory" (name, icon, "listingCount", "createdAt")
       VALUES ($1, $2, 0, NOW())
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [body.name, body.icon || '📦']
    )
    return NextResponse.json({ category: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// DELETE: Delete category
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "MarketplaceCategory" WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}