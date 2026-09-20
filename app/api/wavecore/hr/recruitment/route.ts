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

    let sql = `SELECT * FROM "JobPosting" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (search) { sql += ` AND (title ILIKE $${idx} OR location ILIKE $${idx} OR description ILIKE $${idx})`; params.push(`%${search}%`); idx++ }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    sql += ` ORDER BY "postedDate" DESC LIMIT 500`

    const jobsRes = await pool.query(sql, params)
    const jobs = jobsRes.rows

    const appRes = await pool.query(
      `SELECT "jobPostingId", stage, COUNT(*) AS cnt FROM "Applicant" WHERE "organizationId" = $1 GROUP BY "jobPostingId", stage`,
      [orgId]
    )
    const appMap: Record<string, { total: number; stages: Record<string, number> }> = {}
    for (const row of appRes.rows) {
      if (!appMap[row.jobPostingId]) appMap[row.jobPostingId] = { total: 0, stages: {} }
      appMap[row.jobPostingId].total += Number(row.cnt)
      appMap[row.jobPostingId].stages[row.stage] = Number(row.cnt)
    }

    const enriched = jobs.map(j => ({
      ...j,
      applicantCount: appMap[j.id]?.total || 0,
      applicantsByStage: appMap[j.id]?.stages || {},
    }))

    const totalApplicants = enriched.reduce((s, j) => s + j.applicantCount, 0)
    const openJobs = enriched.filter(j => j.status === 'OPEN')

    const stageTotalMap: Record<string, number> = {}
    for (const r of appRes.rows) {
      stageTotalMap[r.stage] = (stageTotalMap[r.stage] || 0) + Number(r.cnt)
    }
    const applicantsByStage = Object.entries(stageTotalMap).map(([stage, count]) => ({ stage, count }))

    const summary = {
      totalJobs: enriched.length,
      openJobs: openJobs.length,
      closedJobs: enriched.filter(j => j.status === 'CLOSED').length,
      totalApplicants,
      avgApplicantsPerJob: enriched.length > 0 ? Math.round(totalApplicants / enriched.length) : 0,
      inInterview: (stageTotalMap['INTERVIEW'] || 0) + (stageTotalMap['ASSESSMENT'] || 0),
    }

    return NextResponse.json({ jobs, summary, applicantsByStage })
  } catch (error) {
    console.error('Recruitment GET error:', error)
    return NextResponse.json({ jobs: [], summary: {}, applicantsByStage: [], error: 'Something went wrong. Please try again.' })
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
    if (!body.title || !body.title.trim()) return NextResponse.json({ error: 'Job title required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "JobPosting"
        (id, title, "departmentId", "positionId", "employmentType", location, "salaryRange", description, requirements, status, priority, "hiringManagerId", "postedDate", "closingDate", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14,NOW(),NOW())
       RETURNING *`,
      [
        id, body.title.trim(), body.departmentId || null, body.positionId || null,
        body.employmentType || 'FULL_TIME', body.location || null, body.salaryRange || null,
        body.description || null, body.requirements || null, body.status || 'OPEN',
        body.priority || 'NORMAL', body.hiringManagerId || null, body.closingDate || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ job: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}