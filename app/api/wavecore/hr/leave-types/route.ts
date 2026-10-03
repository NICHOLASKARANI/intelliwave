export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

/**
 * GET /api/wavecore/hr/leave-types
 * Returns leave types for this org. Seeds common defaults on first load.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const count = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM "LeaveType" WHERE "organizationId" = $1`,
      [orgId]
    )
    if (Number(count.rows[0]?.cnt || 0) === 0) {
      const crypto = require('crypto')
      const seed = [
        { name: 'Annual Leave',      days: 21, paid: true,  approval: true,  desc: 'Statutory annual leave' },
        { name: 'Sick Leave',        days: 14, paid: true,  approval: true,  desc: 'Medical leave with certificate' },
        { name: 'Maternity Leave',   days: 90, paid: true,  approval: true,  desc: 'Statutory maternity leave' },
        { name: 'Paternity Leave',   days: 14, paid: true,  approval: true,  desc: 'Statutory paternity leave' },
        { name: 'Compassionate',     days: 7,  paid: true,  approval: true,  desc: 'Bereavement / family emergency' },
        { name: 'Study Leave',       days: 5,  paid: true,  approval: true,  desc: 'Exams and professional development' },
        { name: 'Unpaid Leave',      days: 0,  paid: false, approval: true,  desc: 'Personal leave without pay' },
      ]
      for (const row of seed) {
        await pool.query(
          `INSERT INTO "LeaveType"
             (id, name, description, "daysPerYear", "isPaid", "requiresApproval", "organizationId", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
          [crypto.randomUUID(), row.name, row.desc, row.days, row.paid, row.approval, orgId]
        ).catch(() => {})
      }
    }

    const r = await pool.query(
      `SELECT id, name, description, "daysPerYear", "isPaid", "requiresApproval", "createdAt"
       FROM "LeaveType"
       WHERE "organizationId" = $1
       ORDER BY name ASC`,
      [orgId]
    )

    return NextResponse.json({ leaveTypes: r.rows })
  } catch (error) {
    console.error('[leave-types GET]', error)
    return NextResponse.json({ leaveTypes: [], error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/hr/leave-types
 * Body: { name, description, daysPerYear, isPaid, requiresApproval }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json().catch(() => null)
    if (!body || !body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const r = await pool.query(
      `INSERT INTO "LeaveType"
         (id, name, description, "daysPerYear", "isPaid", "requiresApproval", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING *`,
      [
        id,
        String(body.name).trim(),
        body.description || null,
        Number(body.daysPerYear || 0),
        body.isPaid !== undefined ? Boolean(body.isPaid) : true,
        body.requiresApproval !== undefined ? Boolean(body.requiresApproval) : true,
        orgId,
      ]
    )

    return NextResponse.json({ leaveType: r.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[leave-types POST]', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}