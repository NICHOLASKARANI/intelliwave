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

    let sql = `SELECT r.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department, e."jobTitle"
               FROM "PerformanceReview" r
               LEFT JOIN "Employee" e ON e.id = r."employeeId" AND e."organizationId" = r."organizationId"
               WHERE r."organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (search) { sql += ` AND (e."firstName" ILIKE $${idx} OR e."lastName" ILIKE $${idx} OR r."reviewPeriod" ILIKE $${idx})`; params.push(`%${search}%`); idx++ }
    if (status && status !== 'ALL') { sql += ` AND r.status = $${idx++}`; params.push(status) }
    sql += ` ORDER BY r."reviewDate" DESC LIMIT 1000`

    const res = await pool.query(sql, params)
    const reviews = res.rows.map(r => ({
      ...r,
      employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
      score: Number(r.score || 0),
    }))

    const completed = reviews.filter(r => r.status === 'COMPLETED')
    const draft = reviews.filter(r => r.status === 'DRAFT')
    const inProgress = reviews.filter(r => r.status === 'IN_PROGRESS')
    const avgScore = completed.length > 0
      ? Math.round((completed.reduce((s, r) => s + r.score, 0) / completed.length) * 10) / 10
      : 0

    const ratingBuckets = { outstanding: 0, exceeds: 0, meets: 0, needs: 0 }
    for (const r of completed) {
      if (r.score >= 4.5) ratingBuckets.outstanding++
      else if (r.score >= 3.5) ratingBuckets.exceeds++
      else if (r.score >= 2.5) ratingBuckets.meets++
      else ratingBuckets.needs++
    }

    const empRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM "Employee" WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [orgId]
    )
    const activeEmployees = Number(empRes.rows[0]?.cnt || 0)
    const completionRate = activeEmployees > 0 ? Math.round((completed.length / activeEmployees) * 100) : 0

    const summary = {
      total: reviews.length,
      completed: completed.length,
      draft: draft.length,
      inProgress: inProgress.length,
      avgScore,
      completionRate,
      outstanding: ratingBuckets.outstanding,
      exceeds: ratingBuckets.exceeds,
      meets: ratingBuckets.meets,
      needs: ratingBuckets.needs,
    }

    return NextResponse.json({ reviews, summary })
  } catch (error) {
    console.error('Performance GET error:', error)
    return NextResponse.json({ reviews: [], summary: {}, error: 'Something went wrong. Please try again.' })
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
    if (!body.employeeId) return NextResponse.json({ error: 'Employee required' }, { status: 400 })
    if (!body.reviewPeriod) return NextResponse.json({ error: 'Review period required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "PerformanceReview"
        (id, "employeeId", "reviewerId", "reviewPeriod", "reviewType", score, "selfScore", "managerScore",
         "goalsAchieved", "goalsTotal", strengths, improvements, comments, status, "reviewDate", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),$15,NOW(),NOW())
       RETURNING *`,
      [
        id, body.employeeId, body.reviewerId || null, body.reviewPeriod, body.reviewType || 'ANNUAL',
        Number(body.score || 0), Number(body.selfScore || 0), Number(body.managerScore || 0),
        Number(body.goalsAchieved || 0), Number(body.goalsTotal || 0),
        body.strengths || null, body.improvements || null, body.comments || null,
        body.status || 'DRAFT', session.organizationId,
      ]
    )
    return NextResponse.json({ review: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}