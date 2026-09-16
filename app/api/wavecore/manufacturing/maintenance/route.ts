export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')

    let sql = `SELECT * FROM "MaintenanceRequest" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (search) {
      sql += ` AND (number ILIKE $${idx} OR "assetName" ILIKE $${idx} OR "assetCode" ILIKE $${idx} OR description ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    if (priority && priority !== 'ALL') { sql += ` AND priority = $${idx++}`; params.push(priority) }
    if (type && type !== 'ALL') { sql += ` AND type = $${idx++}`; params.push(type) }
    sql += ` ORDER BY "createdAt" DESC`

    const rowsRes = await pool.query(sql, params)
    const requests = rowsRes.rows

    const now = new Date()
    const open = requests.filter(r => r.status === 'OPEN').length
    const inProgress = requests.filter(r => r.status === 'IN_PROGRESS').length
    const completed = requests.filter(r => r.status === 'COMPLETED').length
    const overdue = requests.filter(r =>
      r.status !== 'COMPLETED' && r.status !== 'CANCELLED' &&
      r.requestedDate && new Date(r.requestedDate) < now
    ).length
    const critical = requests.filter(r => r.priority === 'CRITICAL' && r.status !== 'COMPLETED').length

    // Avg resolution time (days) for completed requests
    const completedItems = requests.filter(r => r.status === 'COMPLETED' && r.completedDate && r.createdAt)
    const avgResolutionDays = completedItems.length > 0
      ? Math.round(
          completedItems.reduce((s, r) =>
            s + (new Date(r.completedDate).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          , 0) / completedItems.length * 10
        ) / 10
      : 0

    const summary = {
      total: requests.length,
      open,
      inProgress,
      completed,
      overdue,
      critical,
      avgResolutionDays,
      completionRate: requests.length > 0 ? Math.round((completed / requests.length) * 100) : 0,
    }

    return NextResponse.json({ requests, summary })
  } catch (error) {
    console.error('Maintenance GET error:', error)
    return NextResponse.json({ requests: [], summary: {} })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.assetName || !body.assetName.trim()) return NextResponse.json({ error: 'Asset name is required' }, { status: 400 })
    if (!body.description || !body.description.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'MR-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000)

    const inserted = await pool.query(
      `INSERT INTO "MaintenanceRequest"
        (id, number, type, status, description, "assetName", "assetCode", priority,
         "requestedDate", "assignedToId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       RETURNING *`,
      [
        id,
        number,
        body.type || 'CORRECTIVE',
        body.status || 'OPEN',
        body.description.trim(),
        body.assetName.trim(),
        body.assetCode || null,
        body.priority || 'MEDIUM',
        body.requestedDate || null,
        body.assignedToId || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ request: inserted.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Maintenance POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await pool.query(`DELETE FROM "MaintenanceRequest" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}