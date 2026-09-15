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
    const result = searchParams.get('result')

    let sql = `SELECT * FROM "QualityCheck" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (search) {
      sql += ` AND (type ILIKE $${idx} OR "workOrderId" ILIKE $${idx} OR notes ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (result && result !== 'ALL') {
      sql += ` AND result = $${idx++}`
      params.push(result)
    }
    sql += ` ORDER BY "createdAt" DESC`

    const rowsRes = await pool.query(sql, params)
    const checks = rowsRes.rows

    const passed = checks.filter(c => c.result === 'PASS').length
    const failed = checks.filter(c => c.result === 'FAIL').length
    const pending = checks.filter(c => !c.result || c.result === 'PENDING').length
    const totalInspected = checks.reduce((s, c) => s + Number(c.inspectedQty || 0), 0)
    const totalPassed = checks.reduce((s, c) => s + Number(c.passedQty || 0), 0)
    const totalRejected = checks.reduce((s, c) => s + Number(c.rejectedQty || 0), 0)

    const summary = {
      total: checks.length,
      passed,
      failed,
      pending,
      passRate: checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0,
      totalInspected,
      totalPassed,
      totalRejected,
      rejectRate: totalInspected > 0 ? Math.round((totalRejected / totalInspected) * 100) : 0,
    }

    return NextResponse.json({ checks, summary })
  } catch (error) {
    console.error('Quality GET error:', error)
    return NextResponse.json({ checks: [], summary: {} })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.type || !body.type.trim()) return NextResponse.json({ error: 'Inspection type is required' }, { status: 400 })

    const inspected = Number(body.inspectedQty || 0)
    const passed = Number(body.passedQty || 0)
    const rejected = Number(body.rejectedQty || 0)

    if (inspected <= 0) return NextResponse.json({ error: 'Inspected quantity must be > 0' }, { status: 400 })
    if (passed + rejected > inspected) return NextResponse.json({ error: 'Passed + Rejected cannot exceed Inspected' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const result = body.result || (rejected > 0 ? 'FAIL' : 'PASS')

    const inserted = await pool.query(
      `INSERT INTO "QualityCheck"
        (id, type, result, notes, "inspectedQty", "passedQty", "rejectedQty", "workOrderId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.type.trim(),
        result,
        body.notes || null,
        inspected,
        passed,
        rejected,
        body.workOrderId || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ check: inserted.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Quality POST error:', error)
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
    await pool.query(`DELETE FROM "QualityCheck" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}