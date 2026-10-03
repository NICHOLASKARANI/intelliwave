export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/customers/[id]
 * Returns: customer + contacts + opportunities + quotations + orders
 *          + invoices + payments + activities.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const cRes = await pool.query(
      `SELECT * FROM "Customer" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (cRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    const customer = cRes.rows[0]

    const [
      contactsRes,
      opportunitiesRes,
      quotationsRes,
      ordersRes,
      invoicesRes,
      paymentsRes,
      activitiesRes,
      leadsRes,
    ] = await Promise.all([
      pool.query(
        `SELECT * FROM "Contact" WHERE "customerId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
        [params.id]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, name, amount, stage, probability, "expectedCloseDate", "createdAt"
         FROM "Opportunity"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, number, status, total, "validUntil", "createdAt"
         FROM "Quotation"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, number, status, total, "createdAt"
         FROM "SalesOrder"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, number, status, total, "dueDate", "createdAt"
         FROM "CustomerInvoice"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, number, amount, method, reference, "createdAt"
         FROM "CustomerPayment"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, type, subject, description, "dueDate", completed, "createdAt"
         FROM "Activity"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, name, status, priority, score, "createdAt"
         FROM "Lead"
         WHERE "customerId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
    ])

    // Aggregate stats
    const totalInvoiced = invoicesRes.rows.reduce((s: number, r: any) => s + Number(r.total || 0), 0)
    const totalPaid = paymentsRes.rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const totalQuoted = quotationsRes.rows.reduce((s: number, r: any) => s + Number(r.total || 0), 0)
    const totalOrdered = ordersRes.rows.reduce((s: number, r: any) => s + Number(r.total || 0), 0)
    const openOppsValue = opportunitiesRes.rows
      .filter((o: any) => !['CLOSED_WON','CLOSED_LOST'].includes(o.stage))
      .reduce((s: number, o: any) => s + Number(o.amount || 0), 0)

    return NextResponse.json({
      customer,
      contacts: contactsRes.rows,
      opportunities: opportunitiesRes.rows,
      quotations: quotationsRes.rows,
      orders: ordersRes.rows,
      invoices: invoicesRes.rows,
      payments: paymentsRes.rows,
      activities: activitiesRes.rows,
      leads: leadsRes.rows,
      stats: {
        totalInvoiced,
        totalPaid,
        balance: totalInvoiced - totalPaid,
        totalQuoted,
        totalOrdered,
        openOppsValue,
        counts: {
          contacts: contactsRes.rows.length,
          opportunities: opportunitiesRes.rows.length,
          quotations: quotationsRes.rows.length,
          orders: ordersRes.rows.length,
          invoices: invoicesRes.rows.length,
          payments: paymentsRes.rows.length,
          activities: activitiesRes.rows.length,
          leads: leadsRes.rows.length,
        },
      },
    })
  } catch (error: any) {
    console.error('Customer GET-by-id error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/wavecore/crm/customers/[id]
 * Editable: name, email, phone, company, address, city, country, taxId,
 * website, notes, type, status, source.
 * PUT kept as alias for backwards compatibility.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const allowed = ['name','email','phone','company','address','city','country','taxId','website','notes','type','status','source']
    const sets: string[] = []
    const values: any[] = []
    for (const k of allowed) {
      if (k in body) {
        let v = body[k]
        if (k === 'name' && !String(v || '').trim()) continue
        values.push(v === '' ? null : v)
        sets.push(`"${k}" = $${values.length}`)
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)

    values.push(params.id); const idP = values.length
    values.push(orgId);     const orgP = values.length

    const result = await pool.query(
      `UPDATE "Customer" SET ${sets.join(', ')}
       WHERE id = $${idP} AND "organizationId" = $${orgP}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ success: true, customer: result.rows[0] })
  } catch (error: any) {
    console.error('Customer PATCH error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  return PATCH(request, ctx)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const result = await pool.query(
      'DELETE FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
      [params.id, orgId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}