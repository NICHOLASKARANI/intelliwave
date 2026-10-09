export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { runWorkflow } from '@/lib/wavecore/automation-runner'

// POST: External trigger for a webhook.
// Auth: header X-Webhook-Secret must match the Webhook row's secret.
// Behavior: fires every ACTIVE workflow belonging to the webhook's organization.
// Response: { ok, triggered: [{ workflowId, runId, status }] }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const webhookId = params.id
    const provided = request.headers.get('x-webhook-secret') || ''

    if (!provided) {
      return NextResponse.json({ error: 'Missing X-Webhook-Secret header' }, { status: 401 })
    }

    // Load the webhook and verify the secret
    const wh = await pool.query(
      'SELECT id, name, "organizationId", secret, "isActive" FROM "Webhook" WHERE id = $1',
      [webhookId]
    )
    if (wh.rowCount === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }
    const webhook = wh.rows[0]

    if (!webhook.isActive) {
      return NextResponse.json({ error: 'Webhook is paused' }, { status: 403 })
    }

    // Constant-time-ish comparison; secrets are 64-hex
    if (String(webhook.secret) !== String(provided)) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 403 })
    }

    // Find ACTIVE workflows for the org
    const wf = await pool.query(
      'SELECT id, name FROM "Workflow" WHERE "organizationId" = $1 AND status = $2',
      [webhook.organizationId, 'ACTIVE']
    )

    if (wf.rowCount === 0) {
      return NextResponse.json({ ok: true, triggered: [], note: 'No active workflows' })
    }

    // Fire each workflow
    const triggered: Array<{ workflowId: string; name: string; runId: string; status: string; error?: string }> = []
    for (const w of wf.rows) {
      try {
        const result = await runWorkflow(w.id, webhook.organizationId, 'webhook:' + webhook.name)
        triggered.push({ workflowId: w.id, name: w.name, runId: result.runId, status: result.status })
      } catch (e) {
        triggered.push({ workflowId: w.id, name: w.name, runId: '', status: 'FAILED', error: (e as Error).message })
      }
    }

    return NextResponse.json({ ok: true, triggered })
  } catch (error) {
    console.error('[webhook trigger]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}