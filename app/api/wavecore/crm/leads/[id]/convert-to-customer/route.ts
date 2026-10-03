export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * POST /api/wavecore/crm/leads/[id]/convert-to-customer
 *
 * Creates a Customer from the lead's data, links the lead to that
 * customer, and sets lead status to QUALIFIED (unless already WON).
 * Idempotent: if the lead already has a linked customer, returns it.
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

    const leadRes = await client.query(
      `SELECT * FROM "Lead" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (leadRes.rowCount === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    const lead = leadRes.rows[0]

    // Already converted → return existing customer
    if (lead.customerId) {
      const existing = await client.query(
        `SELECT * FROM "Customer" WHERE id = $1 AND "organizationId" = $2`,
        [lead.customerId, orgId]
      )
      if (existing.rowCount > 0) {
        return NextResponse.json({
          success: true,
          alreadyConverted: true,
          customer: existing.rows[0],
        })
      }
    }

    await client.query('BEGIN')

    const custRes = await client.query(
      `INSERT INTO "Customer"
         (id, name, email, phone, company, source, type, status, notes,
          "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'COMPANY', 'ACTIVE', $6,
               $7, NOW(), NOW())
       RETURNING *`,
      [
        lead.name,
        lead.email || null,
        lead.phone || null,
        lead.company || null,
        lead.source || null,
        lead.notes ? ('Converted from lead. ' + lead.notes) : 'Converted from lead.',
        orgId,
      ]
    )
    const customer = custRes.rows[0]

    const newStatus = lead.status === 'WON' ? 'WON' : 'QUALIFIED'
    await client.query(
      `UPDATE "Lead"
       SET "customerId" = $1, status = $2, "updatedAt" = NOW()
       WHERE id = $3 AND "organizationId" = $4`,
      [customer.id, newStatus, params.id, orgId]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      customer,
      lead: { id: params.id, customerId: customer.id, status: newStatus },
    }, { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Lead convert-to-customer error:', (error as Error).message)
    return NextResponse.json({ error: (error as Error).message || 'Convert failed' }, { status: 500 })
  } finally {
    client.release()
  }
}