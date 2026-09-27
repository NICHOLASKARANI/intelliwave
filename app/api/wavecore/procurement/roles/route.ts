export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/roles
 * Returns role definitions + active assignments for this org.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')

  const [rolesRes, assignsRes] = await Promise.all([
    pool.query(
      `SELECT * FROM "ProcurementRole"
       WHERE "organizationId" = $1
       ORDER BY role`,
      [g.organizationId]
    ),
    pool.query(
      `SELECT * FROM "ProcurementUserRole"
       WHERE "organizationId" = $1
       ORDER BY "assignedAt" DESC`,
      [g.organizationId]
    ),
  ])

  return NextResponse.json({
    roles: rolesRes.rows,
    assignments: assignsRes.rows,
  })
})

/**
 * POST /api/wavecore/procurement/roles
 * Body: { action: 'ASSIGN' | 'REVOKE', userId, userName?, role }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = String(body?.action || 'ASSIGN').toUpperCase()
  const userId = String(body?.userId || '').trim()
  const role = String(body?.role || '').toUpperCase()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 })

  // Validate role exists for this org
  const roleCheck = await pool.query(
    `SELECT role FROM "ProcurementRole"
     WHERE "organizationId" = $1 AND role = $2`,
    [g.organizationId, role]
  )
  if (roleCheck.rowCount === 0) {
    return NextResponse.json({ error: 'Unknown role: ' + role }, { status: 400 })
  }

  if (action === 'ASSIGN') {
    const crypto = require('crypto')
    const upd = await pool.query(
      `INSERT INTO "ProcurementUserRole"
         (id, "organizationId", "userId", "userName", role, status,
          "assignedAt", "assignedBy", "assignedByName", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,'ACTIVE',
               NOW(),$6,$7,NOW(),NOW())
       ON CONFLICT ("organizationId", "userId", role)
       DO UPDATE SET status = 'ACTIVE',
                     "revokedAt" = NULL,
                     "assignedAt" = NOW(),
                     "assignedBy" = EXCLUDED."assignedBy",
                     "assignedByName" = EXCLUDED."assignedByName",
                     "updatedAt" = NOW()
       RETURNING *`,
      [
        crypto.randomUUID(),
        g.organizationId,
        userId,
        body?.userName || null,
        role,
        g.userId,
        g.userName,
      ]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PROCUREMENT_ROLE_ASSIGNED',
      entityType: 'ProcurementUserRole',
      entityId: upd.rows[0].id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Assigned ' + role + ' to ' + (body?.userName || userId),
      metadata: { userId, role },
    })

    return NextResponse.json({ assignment: upd.rows[0] })
  }

  if (action === 'REVOKE') {
    const upd = await pool.query(
      `UPDATE "ProcurementUserRole"
       SET status = 'REVOKED', "revokedAt" = NOW(), "updatedAt" = NOW()
       WHERE "organizationId" = $1 AND "userId" = $2 AND role = $3
       RETURNING *`,
      [g.organizationId, userId, role]
    )
    if (upd.rowCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PROCUREMENT_ROLE_REVOKED',
      entityType: 'ProcurementUserRole',
      entityId: upd.rows[0].id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Revoked ' + role + ' from ' + (body?.userName || userId),
      metadata: { userId, role },
    })

    return NextResponse.json({ assignment: upd.rows[0] })
  }

  return NextResponse.json({ error: 'action must be ASSIGN | REVOKE' }, { status: 400 })
})