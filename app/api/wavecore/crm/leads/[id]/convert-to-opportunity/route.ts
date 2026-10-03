export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * POST /api/wavecore/crm/leads/[id]/convert-to-opportunity
 * Body: { name?, amount?, stage?, probability?, expectedCloseDate?, notes? }
 *
 * Requires the lead to be linked to a customer first. If not linked,
 * automatically converts to customer first, then creates the opportunity.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => ({}))
    const name = String(body.name || '').trim()
    const amount = Number(body.amount) || 0
    if (!name) return NextResponse.json({ error: 'Opportunity name is required' }, { status: 400 })

    const leadRes = await client.query(
      `SELECT * FROM "Lead" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (leadRes.rowCount === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    const lead = leadRes.rows[0]

    await client.query('BEGIN')

    let customerId = lead.customerId

    // Auto-convert to customer if not yet linked
    if (!customerId) {
      const custRes = await client.query(
        `INSERT INTO "Customer"
           (id, name, email, phone, company, source, type, status, notes,
            "organizationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'COMPANY', 'ACTIVE', $6,
                 $7, NOW(), NOW())
         RETURNING id`,
        [
          lead.name,
          lead.email || null,
          lead.phone || null,
          lead.company || null,
          lead.source || null,
          'Converted from lead via opportunity.',
          orgId,
        ]
      )
      customerId = custRes.rows[0].id
      await client.query(
        `UPDATE "Lead" SET "customerId" = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [customerId, params.id, orgId]
      )
    }

    const oppRes = await client.query(
      `INSERT INTO "Opportunity"
         (id, name, amount, stage, probability, "customerId", "expectedCloseDate", notes,
          "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        name,
        amount,
        body.stage || 'QUALIFICATION',
        Math.max(0, Math.min(100, parseInt(body.probability) || 20)),
        customerId,
        body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        body.notes || lead.notes || null,
        orgId,
      ]
    )

    // Advance the lead status
    const newStatus = lead.status === 'WON' ? 'WON' : 'NEGOTIATION'
    await client.query(
      `UPDATE "Lead" SET status = $1, "updatedAt" = NOW()
       WHERE id = $2 AND "organizationId" = $3`,
      [newStatus, params.id, orgId]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      opportunity: oppRes.rows[0],
      customerId,
      lead: { id: params.id, status: newStatus },
    }, { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Lead convert-to-opportunity error:', (error as Error).message)
    return NextResponse.json({ error: (error as Error).message || 'Convert failed' }, { status: 500 })
  } finally {
    client.release()
  }
}