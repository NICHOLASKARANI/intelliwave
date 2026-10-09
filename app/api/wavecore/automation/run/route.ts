export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { checkCsrf } from '@/lib/wavecore/csrf'
import { runWorkflow } from '@/lib/wavecore/automation-runner'

// POST: Manually run a workflow by id
// Body: { workflowId: string }
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    if (!body.workflowId) {
      return NextResponse.json({ error: 'workflowId required' }, { status: 400 })
    }

    const result = await runWorkflow(body.workflowId, session!.organizationId, session!.userId)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('[automation run POST]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}