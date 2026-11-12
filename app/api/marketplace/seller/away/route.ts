export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT "awayMessage", "autoReplyEnabled", "autoReplyMessage", "responseRate"
       FROM "SellerProfile" WHERE "userId" = $1`,
      [session.userId]
    )
    if (res.rows.length === 0) return NextResponse.json({ settings: null })

    return NextResponse.json({ settings: res.rows[0] })
  } catch (error: any) {
    console.error('Away GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    if (body.awayMessage !== undefined) { sets.push(`"awayMessage" = $${i++}`); values.push((body.awayMessage || '').toString().trim().slice(0, 300) || null) }
    if (body.autoReplyEnabled !== undefined) { sets.push(`"autoReplyEnabled" = $${i++}`); values.push(!!body.autoReplyEnabled) }
    if (body.autoReplyMessage !== undefined) { sets.push(`"autoReplyMessage" = $${i++}`); values.push((body.autoReplyMessage || '').toString().trim().slice(0, 300) || null) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(session.userId)

    const result = await pool.query(
      `UPDATE "SellerProfile" SET ${sets.join(', ')}
       WHERE "userId" = $${i}
       RETURNING "awayMessage", "autoReplyEnabled", "autoReplyMessage", "responseRate"`,
      values
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })

    return NextResponse.json({ settings: result.rows[0] })
  } catch (error: any) {
    console.error('Away PUT error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}