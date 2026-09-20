export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const orgId = session.organizationId

    let sql = `SELECT * FROM "OnboardingChecklist" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (search) { sql += ` AND "employeeName" ILIKE $${idx}`; params.push(`%${search}%`); idx++ }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    sql += ` ORDER BY "startDate" DESC LIMIT 500`

    const res = await pool.query(sql, params)
    const checklists = res.rows.map(c => ({
      ...c,
      currentStep: Number(c.currentStep || 0),
      totalSteps: Number(c.totalSteps || 8),
      progress: Number(c.totalSteps || 0) > 0 ? Math.round((Number(c.currentStep || 0) / Number(c.totalSteps)) * 100) : 0,
    }))

    const inProgress = checklists.filter(c => c.status === 'IN_PROGRESS')
    const completed = checklists.filter(c => c.status === 'COMPLETED')
    const avgProgress = checklists.length > 0
      ? Math.round(checklists.reduce((s, c) => s + c.progress, 0) / checklists.length)
      : 0

    const summary = {
      total: checklists.length,
      inProgress: inProgress.length,
      completed: completed.length,
      pending: checklists.filter(c => c.status === 'PENDING').length,
      avgProgress,
    }

    return NextResponse.json({ checklists, summary })
  } catch (error) {
    console.error('Onboarding GET error:', error)
    return NextResponse.json({ checklists: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================
    const body = await request.json()
    if (!body.employeeName || !body.employeeName.trim()) return NextResponse.json({ error: 'Employee name required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "OnboardingChecklist"
        (id, "employeeId", "employeeName", "startDate", "targetCompletionDate", "currentStep", "totalSteps",
         status, notes, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       RETURNING *`,
      [
        id, body.employeeId || null, body.employeeName.trim(),
        body.startDate || new Date().toISOString(),
        body.targetCompletionDate || null,
        Number(body.currentStep || 1), Number(body.totalSteps || 8),
        body.status || 'IN_PROGRESS', body.notes || null, session.organizationId,
      ]
    )
    return NextResponse.json({ checklist: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}