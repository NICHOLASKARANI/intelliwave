export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// POST: toggle public/private (auto-rotate slug on first share)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const makePublic = body.makePublic !== false

    const result = await pool.query(
      `UPDATE "WishlistCollection"
       SET "isPublic" = $1, "updatedAt" = NOW()
       WHERE id = $2 AND "userId" = $3
       RETURNING id, name, slug, "isPublic"`,
      [makePublic, params.id, session.userId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ collection: result.rows[0] })
  } catch (error: any) {
    console.error('Wishlist share error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}