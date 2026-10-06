export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const ALLOWED_STAGES = ['QUALIFICATION','NEEDS_ANALYSIS','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST']

/**
 * POST /api/wavecore/crm/opportunities/bulk
 *
 * Body: { ids: string[], action: 'delete'|'assign'|'stage'|'probability',
 *         payload?: { assignedToId?, stage?, probability? } }
 *
 *   delete       — hard delete
 *   assign       — set assignedToId (or NULL)
 *   stage        — set stage to a valid Stage enum
 *   probability  — set probability (0–100)
 *
 * Tenant-scoped, transactional, returns { updated, skipped, errors }.
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }
    const ids: string[] = body.ids.filter((x: any) => typeof x === 'string' && x.length > 0)
    if (ids.length === 0) return NextResponse.json({ error: 'No valid ids' }, { status: 400 })
    if (ids.length > 500) return NextResponse.json({ error: 'Too many ids (max 500)' }, { status: 400 })

    const action = String(body.action || '')
    const payload = body.payload || {}

    const ownRes = await client.query(
      `SELECT id FROM "Opportunity" WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
      [orgId, ids]
    )
    const ownedIds = ownRes.rows.map((r: any) => r.id)
    const skipped = ids.filter(id => !ownedIds.includes(id))

    if (ownedIds.length === 0) {
      return NextResponse.json({ updated: 0, skipped, errors: ['No matching opportunities in this org'] })
    }

    await client.query('BEGIN')
    let updated = 0

    if (action === 'delete') {
      const r = await client.query(
        `DELETE FROM "Opportunity" WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
        [orgId, ownedIds]
      )
      updated = r.rowCount || 0
    } else if (action === 'assign') {
      const target = payload.assignedToId ? String(payload.assignedToId) : null
      if (target) {
        const m = await client.query(
          `SELECT 1 FROM "_OrganizationMembers" WHERE "A" = $1 AND "B" = $2`,
          [orgId, target]
        ).catch(() => ({ rowCount: 1 }))
        if (m.rowCount === 0) {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Assigned user is not an organization member' }, { status: 400 })
        }
      }
      const r = await client.query(
        `UPDATE "Opportunity" SET "assignedToId" = $1, "updatedAt" = NOW()
         WHERE "organizationId" = $2 AND id = ANY($3::text[])`,
        [target, orgId, ownedIds]
      )
      updated = r.rowCount || 0
    } else if (action === 'stage') {
      const stage = String(payload.stage || '').toUpperCase()
      if (!ALLOWED_STAGES.includes(stage)) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Invalid stage: ' + stage }, { status: 400 })
      }
      const r = await client.query(
        `UPDATE "Opportunity" SET stage = $1, "updatedAt" = NOW()
         WHERE "organizationId" = $2 AND id = ANY($3::text[])`,
        [stage, orgId, ownedIds]
      )
      updated = r.rowCount || 0
    } else if (action === 'probability') {
      const p = Math.max(0, Math.min(100, parseInt(String(payload.probability)) || 0))
      const r = await client.query(
        `UPDATE "Opportunity" SET probability = $1, "updatedAt" = NOW()
         WHERE "organizationId" = $2 AND id = ANY($3::text[])`,
        [p, orgId, ownedIds]
      )
      updated = r.rowCount || 0
    } else {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Unknown action: ' + action }, { status: 400 })
    }

    await client.query('COMMIT')
    return NextResponse.json({ updated, skipped, errors: [] })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[crm/opportunities/bulk]', error)
    return NextResponse.json({ error: 'Bulk action failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}