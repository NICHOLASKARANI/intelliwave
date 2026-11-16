import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRes = await pool.query(
      `SELECT id FROM "Document" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (docRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const { expiresInHours, password } = body

    // Generate secure token
    const crypto = require('crypto')
    const token = crypto.randomBytes(24).toString('hex')
    const id = crypto.randomUUID()

    let expiresAt: Date | null = null
    if (expiresInHours && Number(expiresInHours) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000)
    }

    await pool.query(
      `INSERT INTO "DocumentShare"
        (id, "documentId", "organizationId", token, "expiresAt", password, "viewCount", "createdById", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, NOW())`,
      [id, params.id, session.organizationId, token, expiresAt, password || null, session.userId]
    )

    return NextResponse.json({
      ok: true,
      token,
      url: '/wavecore-erp/documents/shared/' + token,
      expiresAt,
    }, { status: 201 })
  } catch (err) {
    console.error('[share POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, token, "expiresAt", "viewCount", "createdAt" 
       FROM "DocumentShare" WHERE "documentId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC`,
      [params.id, session.organizationId]
    )

    return NextResponse.json({ shares: result.rows })
  } catch (err) {
    console.error('[share GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}