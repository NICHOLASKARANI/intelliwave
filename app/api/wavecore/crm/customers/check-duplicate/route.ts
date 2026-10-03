export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/customers/check-duplicate?email=&phone=&name=
 *
 * Read-only soft-duplicate check. Returns up to 5 candidate matches
 * ranked by strength of signal (email > phone > exact name > fuzzy name).
 * Never blocks — caller decides what to do with the list.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const email = String(searchParams.get('email') || '').trim().toLowerCase()
    const phone = String(searchParams.get('phone') || '').trim()
    const name = String(searchParams.get('name') || '').trim().toLowerCase()

    if (!email && !phone && !name) {
      return NextResponse.json({ matches: [] })
    }

    const rows: any[] = []

    // 1. Email exact (case-insensitive) — strongest signal
    if (email) {
      const r = await pool.query(
        `SELECT id, name, email, phone, company, 'email' AS match_type
         FROM "Customer"
         WHERE "organizationId" = $1 AND LOWER(COALESCE(email,'')) = $2
         LIMIT 5`,
        [session.organizationId, email]
      )
      for (const row of r.rows) if (!rows.find(x => x.id === row.id)) rows.push(row)
    }

    // 2. Phone exact — strong signal
    if (phone) {
      const r = await pool.query(
        `SELECT id, name, email, phone, company, 'phone' AS match_type
         FROM "Customer"
         WHERE "organizationId" = $1 AND COALESCE(phone,'') = $2
         LIMIT 5`,
        [session.organizationId, phone]
      )
      for (const row of r.rows) if (!rows.find(x => x.id === row.id)) rows.push(row)
    }

    // 3. Name exact match — soft signal
    if (name) {
      const r = await pool.query(
        `SELECT id, name, email, phone, company, 'name' AS match_type
         FROM "Customer"
         WHERE "organizationId" = $1 AND LOWER(name) = $2
         LIMIT 5`,
        [session.organizationId, name]
      )
      for (const row of r.rows) if (!rows.find(x => x.id === row.id)) rows.push(row)
    }

    // 4. Name fuzzy (contains) — softest signal
    if (name && name.length >= 4 && rows.length < 5) {
      const r = await pool.query(
        `SELECT id, name, email, phone, company, 'name-like' AS match_type
         FROM "Customer"
         WHERE "organizationId" = $1 AND LOWER(name) LIKE $2
         LIMIT 5`,
        [session.organizationId, '%' + name + '%']
      )
      for (const row of r.rows) if (!rows.find(x => x.id === row.id)) rows.push(row)
    }

    return NextResponse.json({ matches: rows.slice(0, 5) })
  } catch (error: any) {
    console.error('Customer duplicate check error:', (error as Error).message)
    return NextResponse.json({ matches: [] })
  }
}