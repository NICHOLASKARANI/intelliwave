export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await pool.query(
      `SELECT * FROM "Task" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ task: res.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['title', 'description', 'status', 'priority', 'assigneeId', 'tags', 'parentTaskId']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    for (const k of ['estimatedHours', 'actualHours', 'sortOrder']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(Number(body[k] || 0)) }
    }
    for (const k of ['startDate', 'dueDate']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    // Auto-stamp completedAt when transitioning to DONE
    if (body.status === 'DONE') {
      sets.push(`"completedAt" = NOW()`)
    } else if (body.status && body.status !== 'DONE') {
      sets.push(`"completedAt" = NULL`)
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "Task" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ task: result.rows[0] })
  } catch (error) {
    console.error('Task PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cascade delete subtasks + time entries
    await pool.query(`DELETE FROM "Task" WHERE "parentTaskId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "TimeEntry" WHERE "taskId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "ProjectComment" WHERE "taskId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])

    const result = await pool.query(
      `DELETE FROM "Task" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}