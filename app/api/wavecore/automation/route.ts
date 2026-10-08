export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { checkCsrf } from '@/lib/wavecore/csrf'
import { ensureAutomationSchema } from '@/lib/wavecore/automation-schema'

// GET: List all workflows for tenant
export async function GET(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


    const result = await pool.query(
      `SELECT * FROM "Workflow" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session!.organizationId]
    )

    let stats = { successRate: 0, totalRuns: 0, successRuns: 0, failedRuns: 0, runsToday: 0 }
    try {
      const logStats = await pool.query(
        'SELECT COUNT(*)::int AS total, ' +
        'COUNT(*) FILTER (WHERE status = $2)::int AS success, ' +
        'COUNT(*) FILTER (WHERE status = $3)::int AS failed, ' +
        'COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS today ' +
        'FROM "ExecutionLog" WHERE "organizationId" = $1',
        [session!.organizationId, 'SUCCESS', 'FAILED']
      )
      const r = logStats.rows[0] || {}
      const totalRuns = r.total || 0
      const successRuns = r.success || 0
      const failedRuns = r.failed || 0
      const runsToday = r.today || 0
      stats = {
        successRate: totalRuns > 0 ? Math.round((successRuns / totalRuns) * 1000) / 10 : 0,
        totalRuns,
        successRuns,
        failedRuns,
        runsToday,
      }
    } catch (e) {
      console.warn('[automation GET] ExecutionLog query failed:', (e as Error).message)
    }

    // Approval chains + steps for this tenant (real data from procurement)
    let approvalChainCount = 0
    let approvalStepCount = 0
    try {
      const chainR = await pool.query(
        'SELECT COUNT(*)::int AS n FROM "ApprovalChain" WHERE "organizationId" = $1 AND "isActive" = true',
        [session!.organizationId]
      )
      const stepR = await pool.query(
        'SELECT COUNT(*)::int AS n FROM "ApprovalStep" WHERE "organizationId" = $1',
        [session!.organizationId]
      )
      approvalChainCount = chainR.rows[0]?.n || 0
      approvalStepCount = stepR.rows[0]?.n || 0
    } catch (e) {
      console.warn('[automation GET] approval query failed:', (e as Error).message)
    }
    // Attach steps to each workflow (single extra query, grouped in JS)
    const stepsByWf = new Map<string, any[]>()
    if (result.rows.length > 0) {
      try {
        const ids = result.rows.map((w: any) => w.id)
        const stepsResult = await pool.query(
          `SELECT * FROM "WorkflowStep" WHERE "workflowId" = ANY($1) ORDER BY "workflowId", "stepNumber"`,
          [ids]
        )
        for (const s of stepsResult.rows) {
          const arr = stepsByWf.get(s.workflowId) || []
          arr.push(s)
          stepsByWf.set(s.workflowId, arr)
        }
      } catch { /* WorkflowStep may be empty — fall through with no steps */ }
    }

    return NextResponse.json({
      workflows: result.rows.map((w: any) => ({ ...w, steps: stepsByWf.get(w.id) || [] })),
      stats,
      approvals: { chainCount: approvalChainCount, stepCount: approvalStepCount },
    })
  } catch (error) {
    console.error('[automation GET]', error)
    return NextResponse.json({ workflows: [], error: 'Failed to load workflows' }, { status: 500 })
  }
}

// POST: Create new workflow
export async function POST(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const crypto = require('crypto')
    const workflowId = crypto.randomUUID()

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const wfResult = await client.query(
        `INSERT INTO "Workflow" (id, name, trigger, status, "organizationId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'ACTIVE', $4, NOW(), NOW())
         RETURNING *`,
        [workflowId, body.name, body.trigger || 'Schedule', session!.organizationId]
      )

      const incomingSteps = Array.isArray(body.steps) ? body.steps : []
      const savedSteps: any[] = []
      for (let idx = 0; idx < incomingSteps.length; idx++) {
        const s = incomingSteps[idx] || {}
        const stepId = crypto.randomUUID()
        const stepRow = await client.query(
          `INSERT INTO "WorkflowStep" (id, "workflowId", "stepNumber", type, config, "organizationId", "createdAt")
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
           RETURNING *`,
          [stepId, workflowId, idx + 1, String(s.type || 'notification'), JSON.stringify(s.config || {}), session!.organizationId]
        )
        savedSteps.push(stepRow.rows[0])
      }

      await client.query('COMMIT')

      return NextResponse.json(
        { workflow: { ...wfResult.rows[0], steps: savedSteps } },
        { status: 201 }
      )
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PUT: Update workflow
export async function PUT(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const crypto = require('crypto')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const result = await client.query(
        `UPDATE "Workflow" SET name = $1, trigger = $2, status = $3, "updatedAt" = NOW()
         WHERE id = $4 AND "organizationId" = $5
         RETURNING *`,
        [body.name, body.trigger, body.status, body.id, session!.organizationId]
      )

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      // If steps provided, replace them entirely.
      // If omitted, existing steps are preserved (name/trigger-only updates).
      let savedSteps: any[] | null = null
      if (Array.isArray(body.steps)) {
        await client.query(
          `DELETE FROM "WorkflowStep" WHERE "workflowId" = $1 AND "organizationId" = $2`,
          [body.id, session!.organizationId]
        )
        savedSteps = []
        for (let idx = 0; idx < body.steps.length; idx++) {
          const s = body.steps[idx] || {}
          const stepId = crypto.randomUUID()
          const stepRow = await client.query(
            `INSERT INTO "WorkflowStep" (id, "workflowId", "stepNumber", type, config, "organizationId", "createdAt")
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
             RETURNING *`,
            [stepId, body.id, idx + 1, String(s.type || 'notification'), JSON.stringify(s.config || {}), session!.organizationId]
          )
          savedSteps.push(stepRow.rows[0])
        }
      }

      await client.query('COMMIT')

      return NextResponse.json({
        workflow: {
          ...result.rows[0],
          ...(savedSteps !== null ? { steps: savedSteps } : {}),
        },
      })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Delete workflow
export async function DELETE(request: NextRequest) {
  try {
    await ensureAutomationSchema()
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `DELETE FROM "WorkflowStep" WHERE "workflowId" = $1 AND "organizationId" = $2`,
        [id, session!.organizationId]
      )
      await client.query(
        `DELETE FROM "Workflow" WHERE id = $1 AND "organizationId" = $2`,
        [id, session!.organizationId]
      )
      await client.query('COMMIT')
      return NextResponse.json({ success: true })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}
