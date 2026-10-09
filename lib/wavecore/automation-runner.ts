// WaveCore — Automation Execution Engine (WF-12a)
// Runs a workflow: iterates its steps in order, records a
// WorkflowRun, writes ExecutionLog rows for the run and for
// each notification step, and returns a structured result.
//
// Step semantics:
//   notification  — inserts a Notification row (real side effect)
//   webhook       — logged, not fired (WF-12b will fire)
//   *             — logged as "skipped (not implemented)"

import { pool } from '@/lib/wavecore/db'
import crypto from 'crypto'

export interface RunResult {
  runId: string
  workflowId: string
  status: 'SUCCESS' | 'FAILED'
  durationMs: number
  stepsRun: number
  stepsSkipped: number
  logEntries: Array<{ stepNumber: number; type: string; status: string; note: string }>
  error?: string
}

function formatDuration(ms: number): string {
  if (ms < 1000) return ms + 'ms'
  return (ms / 1000).toFixed(1) + 's'
}

export async function runWorkflow(
  workflowId: string,
  organizationId: string,
  triggeredBy?: string
): Promise<RunResult> {
  const start = Date.now()
  const runId = crypto.randomUUID()

  // 1. Load workflow header
  const wf = await pool.query(
    'SELECT id, name, status FROM "Workflow" WHERE id = $1 AND "organizationId" = $2',
    [workflowId, organizationId]
  )
  if (wf.rowCount === 0) {
    throw new Error('Workflow not found')
  }
  const workflow = wf.rows[0]

  // 2. Load steps in order
  const stepsRes = await pool.query(
    'SELECT * FROM "WorkflowStep" WHERE "workflowId" = $1 ORDER BY "stepNumber"',
    [workflowId]
  )
  const steps = stepsRes.rows

  // 3. Create WorkflowRun row (RUNNING)
  await pool.query(
    'INSERT INTO "WorkflowRun" (id, "workflowId", "organizationId", status, "triggeredBy", "startedAt", "createdAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
    [runId, workflowId, organizationId, 'RUNNING', triggeredBy || null]
  )

  const logEntries: Array<{ stepNumber: number; type: string; status: string; note: string }> = []
  let stepsRun = 0
  let stepsSkipped = 0
  let runError: string | undefined = undefined

  // 4. Execute each step
  for (const step of steps) {
    try {
      if (step.type === 'notification') {
        // Real side effect: insert a Notification row for the org owner
        const owner = await pool.query(
          'SELECT "ownerId" FROM "Organization" WHERE id = $1 LIMIT 1',
          [organizationId]
        )
        const userId = owner.rows[0]?.ownerId || null
        const title = 'Workflow run: ' + workflow.name
        const content = 'Step #' + step.stepNumber + ' (' + step.type + ') executed successfully.'
        await pool.query(
          'INSERT INTO "Notification" (id, "userId", "organizationId", type, title, content, "isRead", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, false, NOW())',
          [crypto.randomUUID(), userId, organizationId, 'AUTOMATION', title, content]
        )
        logEntries.push({ stepNumber: step.stepNumber, type: step.type, status: 'SUCCESS', note: 'notification sent' })
        stepsRun++
      } else if (step.type === 'webhook') {
        // Real side effect: POST JSON to the URL configured on the step.
        const cfg = (step.config || {}) as { url?: string; headers?: Record<string, string> }
        const targetUrl = cfg.url
        if (!targetUrl) throw new Error('webhook step missing config.url')
        const payload = {
          workflow: workflow.name,
          workflowId: workflowId,
          runId: runId,
          step: step.stepNumber,
          stepType: step.type,
          at: new Date().toISOString(),
        }
        const resp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WaveCore-Event': 'workflow.step',
            ...(cfg.headers || {}),
          },
          body: JSON.stringify(payload),
        })
        if (!resp.ok) throw new Error('webhook returned HTTP ' + resp.status)
        logEntries.push({ stepNumber: step.stepNumber, type: step.type, status: 'SUCCESS', note: 'webhook POST ' + resp.status })
        stepsRun++
      } else {
        // Logged but not executed
        logEntries.push({ stepNumber: step.stepNumber, type: step.type, status: 'SKIPPED', note: 'step type not implemented yet' })
        stepsSkipped++
      }
    } catch (e) {
      logEntries.push({ stepNumber: step.stepNumber, type: step.type, status: 'FAILED', note: (e as Error).message })
      runError = 'Step #' + step.stepNumber + ' failed: ' + (e as Error).message
      break
    }
  }

  const durationMs = Date.now() - start
  const status: 'SUCCESS' | 'FAILED' = runError ? 'FAILED' : 'SUCCESS'

  // 5. Update WorkflowRun with final status
  await pool.query(
    'UPDATE "WorkflowRun" SET status = $1, "finishedAt" = NOW(), "durationMs" = $2, output = $3::jsonb, error = $4 WHERE id = $5',
    [status, durationMs, JSON.stringify({ stepsRun, stepsSkipped, logEntries }), runError || null, runId]
  )

  // 6. Write an ExecutionLog row (workflow-level)
  await pool.query(
    'INSERT INTO "ExecutionLog" (id, "workflowId", "workflowName", status, duration, "organizationId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [crypto.randomUUID(), workflowId, workflow.name, status, formatDuration(durationMs), organizationId]
  )

  return {
    runId,
    workflowId,
    status,
    durationMs,
    stepsRun,
    stepsSkipped,
    logEntries,
    error: runError,
  }
}