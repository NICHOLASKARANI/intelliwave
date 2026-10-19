export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100')))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const skip = (page - 1) * limit

    // Build query with optional action search
    const params: any[] = [orgId]
    let whereClause = '"organizationId" = $1'
    if (search) {
      params.push('%' + search + '%')
      whereClause += ' AND action ILIKE $' + params.length
    }

    // Count + page fetch
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "AuditLog" WHERE ${whereClause}`,
      params
    )
    const total = countRes.rows[0]?.total || 0

    params.push(limit, skip)
    const rowsRes = await pool.query(
      `SELECT * FROM "AuditLog"
       WHERE ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return NextResponse.json({
      logs: rowsRes.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Audit log fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "AuditLog"
         (id, action, "entityType", "entityId", changes, "userId", "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        id,
        String(body.action),
        body.entityType ? String(body.entityType) : null,
        body.entityId ? String(body.entityId) : null,
        body.changes ? String(body.changes) : null,
        body.userId ? String(body.userId) : session.userId,
        session.organizationId,
      ]
    )

    return NextResponse.json({ log: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Audit log create error:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}