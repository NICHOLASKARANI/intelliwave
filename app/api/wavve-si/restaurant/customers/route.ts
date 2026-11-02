export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// GET /api/wavve-si/restaurant/customers
// Query params: search, limit (default 50), offset (default 0)
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || null
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

    const conditions = ['"organizationId" = $1']
    const params: any[] = [orgId]

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR company ILIKE $${params.length})`)
    }

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const result = await pool.query(
      `SELECT id, name, email, phone, company, city, country, status, "createdAt"
       FROM "Customer"
       WHERE ${conditions.join(' AND ')}
       ORDER BY "createdAt" DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM "Customer" WHERE ${conditions.slice(0, -2).join(' AND ')}`,
      params.slice(0, -2)
    )

    return NextResponse.json({
      customers: result.rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        city: r.city,
        country: r.country,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total: Number(countResult.rows[0]?.total) || 0,
      limit, offset,
    })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/customers] GET error:', err?.message)
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 })
  }
}