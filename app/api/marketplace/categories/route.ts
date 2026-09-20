export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: Public — anyone can list categories
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT * FROM "MarketplaceCategory" ORDER BY "listingCount" DESC, name ASC`
    )
    return NextResponse.json({ categories: result.rows })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ categories: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Admin only (any authenticated user)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const result = await pool.query(
      `INSERT INTO "MarketplaceCategory" (name, icon, "listingCount", "createdAt")
       VALUES ($1, $2, 0, NOW())
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [body.name.trim(), body.icon || '📦']
    )
    return NextResponse.json({ category: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Admin only
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await pool.query(`DELETE FROM "MarketplaceCategory" WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}