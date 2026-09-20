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

    let sql = `SELECT * FROM "BenefitProgram" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (search) { sql += ` AND (name ILIKE $${idx} OR provider ILIKE $${idx} OR category ILIKE $${idx})`; params.push(`%${search}%`); idx++ }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    sql += ` ORDER BY name ASC LIMIT 500`

    const res = await pool.query(sql, params)
    const benefits = res.rows.map(b => ({
      ...b,
      enrolledCount: Number(b.enrolledCount || 0),
      employerContribution: Number(b.employerContribution || 0),
      employeeContribution: Number(b.employeeContribution || 0),
      monthlyEmployerCost: Number(b.enrolledCount || 0) * Number(b.employerContribution || 0),
    }))

    const active = benefits.filter(b => b.status === 'ACTIVE')
    const totalEnrolled = benefits.reduce((s, b) => s + b.enrolledCount, 0)
    const totalMonthlyEmployerCost = benefits.reduce((s, b) => s + b.monthlyEmployerCost, 0)
    const avgEmployerCostPerEmployee = totalEnrolled > 0
      ? Math.round(totalMonthlyEmployerCost / totalEnrolled)
      : 0

    const summary = {
      total: benefits.length,
      active: active.length,
      totalEnrolled,
      totalMonthlyEmployerCost: Math.round(totalMonthlyEmployerCost),
      avgEmployerCostPerEmployee,
      providers: new Set(benefits.map(b => b.provider).filter(Boolean)).size,
    }

    return NextResponse.json({ benefits, summary })
  } catch (error) {
    console.error('Benefits GET error:', error)
    return NextResponse.json({ benefits: [], summary: {}, error: (error as Error).message })
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
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "BenefitProgram"
        (id, name, category, provider, description, "employerContribution", "employeeContribution",
         eligibility, "enrolledCount", status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       RETURNING *`,
      [
        id, body.name.trim(), body.category || null, body.provider || null, body.description || null,
        Number(body.employerContribution || 0), Number(body.employeeContribution || 0),
        body.eligibility || null, Number(body.enrolledCount || 0),
        body.status || 'ACTIVE', session.organizationId,
      ]
    )
    return NextResponse.json({ benefit: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}