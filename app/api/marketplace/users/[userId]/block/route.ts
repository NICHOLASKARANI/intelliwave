export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (params.userId === session.userId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const reason = (body.reason || '').toString().trim().slice(0, 200) || null

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "MarketplaceUserBlock" (id, "blockerId", "blockedId", reason, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT ("blockerId", "blockedId") DO NOTHING`,
      [id, session.userId, params.userId, reason]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Block POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(
      `DELETE FROM "MarketplaceUserBlock" WHERE "blockerId" = $1 AND "blockedId" = $2`,
      [session.userId, params.userId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Block DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}