export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAuditAsync } from '@/lib/wavecore/audit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "SupplierCreditNote" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ creditNote: result.rows[0] })
  } catch (error) {
    console.error('[credit-notes/supplier GET id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowed = ['reason', 'subtotal', 'taxAmount', 'total', 'date', 'supplierName']
    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const f of allowed) {
      if (body[f] !== undefined) {
        sets.push(`"${f}" = $${i++}`)
        values.push(body[f])
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    const result = await pool.query(
      `UPDATE "SupplierCreditNote" SET ${sets.join(', ')}
       WHERE id = $${i} AND "organizationId" = $${i + 1} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await writeAuditAsync({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'SupplierCreditNote',
      entityId: params.id,
      changes: body,
    })

    return NextResponse.json({ creditNote: result.rows[0] })
  } catch (error) {
    console.error('[credit-notes/supplier PATCH]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `DELETE FROM "SupplierCreditNote" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount && result.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'DELETE',
        entityType: 'SupplierCreditNote',
        entityId: params.id,
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[credit-notes/supplier DELETE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}