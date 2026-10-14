export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { checkCsrf } from '@/lib/wavecore/csrf'

// GET — list suppliers for the org
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, email, phone, category, code, country, city, status,
              "isPreferred", "isBlacklisted", "riskLevel", rating,
              "paymentTerms", "creditLimit", notes, "createdAt"
       FROM "Supplier"
       WHERE "organizationId" = $1
       ORDER BY name ASC
       LIMIT 500`,
      [session.organizationId]
    )
    return NextResponse.json({ suppliers: result.rows })
  } catch (error) {
    console.error('[suppliers GET]', error)
    return NextResponse.json({ suppliers: [], error: 'Failed to load suppliers' }, { status: 500 })
  }
}

// POST — create supplier
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Supplier name required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Supplier"
         (id, name, email, phone, category, code, country, city, address,
          status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', $10, NOW(), NOW())
       RETURNING id, name, email, phone, category, code, country, city, status, "createdAt"`,
      [
        id,
        name,
        body.email || null,
        body.phone || null,
        body.category || null,
        body.code || null,
        body.country || null,
        body.city || null,
        body.address || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ supplier: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[suppliers POST]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE — delete supplier
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await pool.query('DELETE FROM "Supplier" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}