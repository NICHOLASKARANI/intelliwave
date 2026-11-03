export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || null
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

    let query = `SELECT id, name, email, phone, company, city, country, status, "createdAt"
                 FROM "Customer"
                 WHERE "organizationId" = $1`
    let countQuery = `SELECT COUNT(*) AS total FROM "Customer" WHERE "organizationId" = $1`
    const params: any[] = [orgId]

    if (search) {
      const searchPattern = `%${search}%`
      query += ` AND (name ILIKE $${params.length + 1} OR COALESCE(email, '') ILIKE $${params.length + 1} OR COALESCE(phone, '') ILIKE $${params.length + 1} OR COALESCE(company, '') ILIKE $${params.length + 1})`
      countQuery += ` AND (name ILIKE $${params.length + 1} OR COALESCE(email, '') ILIKE $${params.length + 1} OR COALESCE(phone, '') ILIKE $${params.length + 1} OR COALESCE(company, '') ILIKE $${params.length + 1})`
      params.push(searchPattern)
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    const countResult = await pool.query(countQuery, params.slice(0, -2))

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
    console.error('[customers] GET error:', err?.message, err?.stack)
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) {
      client.release()
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, company, city, country, notes } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      client.release()
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }

    if (email && email.trim()) {
      const existing = await pool.query(
        'SELECT id FROM "Customer" WHERE email = $1 AND "organizationId" = $2',
        [email.trim(), session.organizationId]
      )
      if (existing.rows.length > 0) {
        client.release()
        return NextResponse.json({ error: 'A customer with this email already exists' }, { status: 409 })
      }
    }

    await client.query('BEGIN')

    const customerId = 'c' + Math.random().toString(36).slice(2, 24)

    await client.query(
      `INSERT INTO "Customer" (id, name, email, phone, company, city, country, notes, type, status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INDIVIDUAL'::"CustomerType", 'ACTIVE'::"CustomerStatus", $9, NOW(), NOW())`,
      [
        customerId,
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        company?.trim() || null,
        city?.trim() || null,
        country?.trim() || null,
        notes?.trim() || null,
        session.organizationId,
      ]
    )

    await client.query('COMMIT')

    const result = await pool.query(
      'SELECT id, name, email, phone, company, city, country, status, "createdAt" FROM "Customer" WHERE id = $1',
      [customerId]
    )

    client.release()
    return NextResponse.json({ success: true, customer: result.rows[0] }, { status: 201 })
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {})
    client.release()
    console.error('[customers] POST error:', err?.message, err?.stack)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}