export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { POST_STATES } from '@/lib/wavecore/social-capabilities'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "SocialPost" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )

    return NextResponse.json({ posts: result.rows })
  } catch (error) {
    return NextResponse.json({ posts: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const idempotencyKey = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "SocialPost" (id, content, hashtags, platform, status, "organizationId", "idempotencyKey", "createdAt")
       VALUES ($1, $2, $3, $4, 'DRAFT', $5, $6, NOW()) RETURNING *`,
      [id, body.content, body.hashtags, body.platform, session.organizationId, idempotencyKey]
    )

    return NextResponse.json({ success: true, post: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Post creation failed' }, { status: 500 })
  }
}