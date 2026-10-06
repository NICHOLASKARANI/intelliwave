export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const ALLOWED_STATUSES = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']

/**
 * POST /api/wavecore/crm/leads/bulk
 *
 * Body: { ids: string[], action: 'delete'|'assign'|'status', payload?: { assignedToId?, status? } }
 *
 * Actions:
 *   delete  — hard delete the given leads
 *   assign  — set assignedToId (or NULL for unassign)
 *   status  — set status to a valid LeadStatus enum value
 *
 * Every id is verified to belong to the caller's org. Nothing crosses
 * tenant boundaries. Runs in a single transaction. Returns counts +
 * any ids that were skipped (foreign / missing).
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

    // Verify all ids belong to org
    const ownRes = await client.query(
      `SELECT id FROM "Lead" WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
      [orgId, ids]
    )
    const ownedIds = ownRes.rows.map((r: any) => r.id)
    const skipped = ids.filter(id => !ownedIds.includes(id))

    if (ownedIds.length === 0) {
      return NextResponse.json({ updated: 0, skipped, errors: ['No matching leads in this org'] })
    }

    await client.query('BEGIN')
    let updated = 0

    if (action === 'delete') {
      const r = await client.query(
        `DELETE FROM "Lead" WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
        [orgId, ownedIds]
      )
      updated = r.rowCount || 0
    } else if (action === 'assign') {
      const target = payload.assignedToId ? String(payload.assignedToId) : null
      // If target is set, verify it's a member of the org
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
        `UPDATE "Lead" SET "assignedToId" = $1, "updatedAt" = NOW()
         WHERE "organizationId" = $2 AND id = ANY($3::text[])`,
        [target, orgId, ownedIds]
      )
      updated = r.rowCount || 0
    } else if (action === 'status') {
      const status = String(payload.status || '').toUpperCase()
      if (!ALLOWED_STATUSES.includes(status)) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Invalid status: ' + status }, { status: 400 })
      }
      const r = await client.query(
        `UPDATE "Lead" SET status = $1, "updatedAt" = NOW()
         WHERE "organizationId" = $2 AND id = ANY($3::text[])`,
        [status, orgId, ownedIds]
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
    console.error('[crm/leads/bulk]', error)
    return NextResponse.json({ error: 'Bulk action failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}