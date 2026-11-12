export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const headerPwd = req.headers.get('x-admin-password')
    const queryPwd = searchParams.get('password')
    if ((headerPwd || queryPwd) !== adminPassword) return NextResponse.json({ error: 'Access denied' }, { status: 401 })

    const filter = (searchParams.get('filter') || 'ALL').toUpperCase()
    const search = (searchParams.get('search') || '').trim()

    let where = '1=1'
    const params: any[] = []
    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      const p = `$${params.length}`
      where += ` AND (LOWER(COALESCE(m.content, '')) LIKE ${p} OR LOWER(COALESCE(rr.name, '')) LIKE ${p} OR LOWER(COALESCE(rs.name, '')) LIKE ${p})`
    }
    if (filter === 'PENDING') where += ` AND r.status = 'PENDING'`
    else if (filter === 'RESOLVED') where += ` AND r.status = 'RESOLVED'`

    const listRes = await pool.query(
      `SELECT
         r.id, r."messageId", r.reason, r.details, r.status, r."createdAt", r."resolvedAt",
         m.content AS "messageContent", m."senderId", m."receiverId", m."conversationId",
         rr.name AS "reporterName",
         rs.name AS "senderName"
       FROM "MarketplaceMessageReport" r
       JOIN "MarketplaceMessage" m ON m.id = r."messageId"
       LEFT JOIN "User" rr ON rr.id = r."reporterId"
       LEFT JOIN "User" rs ON rs.id = m."senderId"
       WHERE ${where}
       ORDER BY r."createdAt" DESC
       LIMIT 200`,
      params
    )

    const kpiRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM "MarketplaceMessageReport")::int AS total,
         (SELECT COUNT(*) FROM "MarketplaceMessageReport" WHERE status = 'PENDING')::int AS pending,
         (SELECT COUNT(*) FROM "MarketplaceMessageReport" WHERE status = 'RESOLVED')::int AS resolved,
         (SELECT COUNT(DISTINCT "blockerId") FROM "MarketplaceUserBlock")::int AS blockers`
    )

    return NextResponse.json({ reports: listRes.rows, kpi: kpiRes.rows[0] })
  } catch (error: any) {
    console.error('Admin messages GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })

    const headerPwd = req.headers.get('x-admin-password')
    const body = await req.json().catch(() => ({}))
    if ((headerPwd || body.password) !== adminPassword) return NextResponse.json({ error: 'Access denied' }, { status: 401 })

    const { reportId, action } = body
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
    if (!['resolve', 'dismiss'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    const newStatus = action === 'resolve' ? 'RESOLVED' : 'DISMISSED'
    await pool.query(
      `UPDATE "MarketplaceMessageReport"
       SET status = $1, "resolvedAt" = NOW(), "resolvedBy" = 'admin'
       WHERE id = $2`,
      [newStatus, reportId]
    )

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    console.error('Admin messages PATCH error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}