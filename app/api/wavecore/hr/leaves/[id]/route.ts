export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const result = await pool.query(
      `SELECT * FROM "LeaveRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ leave: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    // Load current row
    const curRes = await client.query(
      `SELECT * FROM "LeaveRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (curRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const cur = curRes.rows[0]

    const oldStatus = cur.status
    const newStatus = body.status !== undefined ? body.status : oldStatus
    const statusChanging = newStatus !== oldStatus

    // Days for balance adjustment (if status changes and days changes too,
    // use the incoming days; else the current days)
    const daysForAdjust = body.days !== undefined ? Number(body.days || 0) : Number(cur.days || 0)
    const year = new Date(cur.startDate).getFullYear()

    await client.query('BEGIN')

    // Apply the UPDATE
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const key of ['status', 'reason', 'rejectionReason', 'employeeId', 'leaveTypeId']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key] || null) }
    }
    for (const key of ['startDate', 'endDate']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key]) }
    }
    if (body.days !== undefined) { sets.push(`days = $${i++}`); values.push(Number(body.days || 0)) }

    if (body.status === 'APPROVED') {
      sets.push(`"approvedAt" = NOW()`)
      sets.push(`"approvedById" = $${i++}`)
      values.push(session.userId || null)
    }

    if (sets.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, orgId)

    const upd = await client.query(
      `UPDATE "LeaveRequest" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )

    // === BALANCE ADJUSTMENT ON STATUS CHANGE ===
    if (statusChanging) {
      const wasConsuming = oldStatus === 'APPROVED'
      const isConsuming = newStatus === 'APPROVED'
      const leaveTypeId = body.leaveTypeId || cur.leaveTypeId
      const employeeId = body.employeeId || cur.employeeId

      // Ensure a balance row exists
      const balRes = await client.query(
        `SELECT id, "totalDays", "usedDays", "remainingDays"
         FROM "LeaveBalance"
         WHERE "organizationId" = $1 AND "employeeId" = $2 AND "leaveTypeId" = $3 AND year = $4`,
        [orgId, employeeId, leaveTypeId, year]
      )

      if (balRes.rowCount === 0) {
        // Seed from leave type
        const lt = await client.query(
          `SELECT "daysPerYear" FROM "LeaveType" WHERE id = $1`,
          [leaveTypeId]
        ).catch(() => ({ rows: [] }))
        const total = Number(lt.rows[0]?.daysPerYear || 0)
        await client.query(
          `INSERT INTO "LeaveBalance"
             (id, "totalDays", "usedDays", "remainingDays", year, "employeeId", "leaveTypeId", "organizationId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, 0, $1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [total, year, employeeId, leaveTypeId, orgId]
        )
      }

      // Decide delta
      let delta = 0
      if (!wasConsuming && isConsuming) {
        delta = daysForAdjust          // consume
      } else if (wasConsuming && !isConsuming) {
        delta = -daysForAdjust         // refund
      } else if (wasConsuming && isConsuming && body.days !== undefined && Number(body.days) !== Number(cur.days)) {
        delta = Number(body.days) - Number(cur.days)  // adjust by delta
      }

      if (delta !== 0) {
        await client.query(
          `UPDATE "LeaveBalance"
           SET "usedDays" = GREATEST(0, "usedDays" + $1),
               "remainingDays" = GREATEST(0, "totalDays" - GREATEST(0, "usedDays" + $1)),
               "updatedAt" = NOW()
           WHERE "organizationId" = $2 AND "employeeId" = $3 AND "leaveTypeId" = $4 AND year = $5`,
          [delta, orgId, employeeId, leaveTypeId, year]
        )
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ leave: upd.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[leaves PATCH]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    // Load current row first so we can refund if it was approved
    const cur = await client.query(
      `SELECT * FROM "LeaveRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (cur.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await client.query('BEGIN')

    if (cur.rows[0].status === 'APPROVED') {
      const year = new Date(cur.rows[0].startDate).getFullYear()
      await client.query(
        `UPDATE "LeaveBalance"
         SET "usedDays" = GREATEST(0, "usedDays" - $1),
             "remainingDays" = GREATEST(0, "totalDays" - GREATEST(0, "usedDays" - $1)),
             "updatedAt" = NOW()
         WHERE "organizationId" = $2 AND "employeeId" = $3 AND "leaveTypeId" = $4 AND year = $5`,
        [Number(cur.rows[0].days || 0), session.organizationId, cur.rows[0].employeeId, cur.rows[0].leaveTypeId, year]
      )
    }

    const result = await client.query(
      `DELETE FROM "LeaveRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    await client.query('COMMIT')
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[leaves DELETE]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  } finally {
    client.release()
  }
}