export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: PDF tool history for the org
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const tool = searchParams.get('tool')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    let sql = `SELECT * FROM "PDFJob" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    if (tool) { sql += ` AND tool = $2`; params.push(tool) }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const res = await pool.query(sql, params)
    const jobs = res.rows.map(j => ({
      ...j,
      inputSize: Number(j.inputSize || 0),
      outputSize: Number(j.outputSize || 0),
      processingMs: Number(j.processingMs || 0),
    }))

    const summary = {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'COMPLETED').length,
      failed: jobs.filter(j => j.status === 'FAILED').length,
      totalBytesProcessed: jobs.reduce((s, j) => s + j.inputSize, 0),
      avgProcessingMs: jobs.length > 0 ? Math.round(jobs.reduce((s, j) => s + j.processingMs, 0) / jobs.length) : 0,
    }

    return NextResponse.json({ jobs, summary })
  } catch (error) {
    console.error('PDF history error:', error)
    return NextResponse.json({ jobs: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}