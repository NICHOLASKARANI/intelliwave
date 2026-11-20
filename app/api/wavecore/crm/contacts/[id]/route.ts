export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAuditAsync } from '@/lib/wavecore/audit'
import { normalizeKenyanPhone } from '@/lib/wavecore/crm/whatsapp'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT c.*, cu.name AS "customerName"
       FROM "Contact" c
       LEFT JOIN "Customer" cu ON cu.id = c."customerId"
       WHERE c.id = $1 AND c."organizationId" = $2
       LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ contact: result.rows[0] })
  } catch (error) {
    console.error('[crm/contacts/[id] GET]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Explicit allowed list — no arbitrary column writes
    const allowed = [
      'firstName', 'lastName', 'email', 'phone', 'whatsappNumber',
      'position', 'department', 'isPrimary', 'isDecisionMaker',
      'consentEmail', 'consentSms', 'consentWhatsapp', 'notes',
    ]
    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const f of allowed) {
      if (body[f] !== undefined) {
        let val = body[f]
        if (f === 'whatsappNumber' && val) val = normalizeKenyanPhone(val) || val
        sets.push(`"${f}" = $${i++}`)
        values.push(val)
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    const result = await pool.query(
      `UPDATE "Contact" SET ${sets.join(', ')}
       WHERE id = $${i} AND "organizationId" = $${i + 1} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await writeAuditAsync({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'Contact',
      entityId: params.id,
      changes: body,
    })

    return NextResponse.json({ contact: result.rows[0] })
  } catch (error) {
    console.error('[crm/contacts/[id] PATCH]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `DELETE FROM "Contact" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount && result.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'DELETE',
        entityType: 'Contact',
        entityId: params.id,
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[crm/contacts/[id] DELETE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}