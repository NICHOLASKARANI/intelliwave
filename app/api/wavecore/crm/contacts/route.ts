export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAudit, writeAuditAsync } from '@/lib/wavecore/audit'
import { normalizeKenyanPhone } from '@/lib/wavecore/crm/whatsapp'

/**
 * GET /api/wavecore/crm/contacts?customerId=xxx
 * List contacts for a customer (tenant-isolated).
 * If no customerId, returns all contacts for the org.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const params: any[] = [session.organizationId]
    let where = 'WHERE c."organizationId" = $1'
    if (customerId) {
      params.push(customerId)
      where += ` AND c."customerId" = $${params.length}`
    }

    const result = await pool.query(
      `SELECT c.id, c."customerId", c."firstName", c."lastName", c.email, c.phone,
              c."whatsappNumber", c.position, c.department, c."isPrimary",
              c."isDecisionMaker", c."consentEmail", c."consentSms", c."consentWhatsapp",
              c.notes, c."createdAt", c."updatedAt",
              cu.name AS "customerName"
       FROM "Contact" c
       LEFT JOIN "Customer" cu ON cu.id = c."customerId"
       ${where}
       ORDER BY c."isPrimary" DESC, c."createdAt" DESC
       LIMIT 500`,
      params
    )

    return NextResponse.json({ contacts: result.rows })
  } catch (error) {
    console.error('[crm/contacts GET]', error)
    return NextResponse.json({ contacts: [], error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/crm/contacts
 * Body: { customerId, firstName, lastName, email?, phone?, whatsappNumber?,
 *         position?, department?, isPrimary?, isDecisionMaker?,
 *         consentEmail?, consentSms?, consentWhatsapp?, notes? }
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const customerId = String(body.customerId || '').trim()
    if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 })

    const firstName = String(body.firstName || '').trim()
    const lastName = String(body.lastName || '').trim()
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName required' }, { status: 400 })
    }

    // Verify customer belongs to this org (tenant isolation)
    const cust = await client.query(
      `SELECT id FROM "Customer" WHERE id = $1 AND "organizationId" = $2`,
      [customerId, session.organizationId]
    )
    if (cust.rowCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Normalize WhatsApp number to E.164
    const whatsappRaw = body.whatsappNumber || body.phone || null
    const whatsappNumber = whatsappRaw ? (normalizeKenyanPhone(whatsappRaw) || whatsappRaw) : null

    // If marking as primary, unset other primaries for this customer
    const isPrimary = !!body.isPrimary
    await client.query('BEGIN')
    if (isPrimary) {
      await client.query(
        `UPDATE "Contact" SET "isPrimary" = false, "updatedAt" = NOW()
         WHERE "customerId" = $1 AND "organizationId" = $2 AND "isPrimary" = true`,
        [customerId, session.organizationId]
      )
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await client.query(
      `INSERT INTO "Contact"
         (id, "organizationId", "customerId", "firstName", "lastName",
          email, phone, "whatsappNumber", position, department,
          "isPrimary", "isDecisionMaker",
          "consentEmail", "consentSms", "consentWhatsapp", notes,
          "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               $11, $12, $13, $14, $15, $16, NOW(), NOW())
       RETURNING *`,
      [
        id, session.organizationId, customerId, firstName, lastName,
        body.email || null, body.phone || null, whatsappNumber,
        body.position || null, body.department || null,
        isPrimary, !!body.isDecisionMaker,
        body.consentEmail !== false, body.consentSms !== false, body.consentWhatsapp !== false,
        body.notes || null,
      ]
    )

    await writeAudit(client, {
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'CREATE',
      entityType: 'Contact',
      entityId: id,
      changes: { customerId, firstName, lastName, email: body.email || null, whatsappNumber, isPrimary },
    })

    await client.query('COMMIT')

    return NextResponse.json({ contact: result.rows[0] }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[crm/contacts POST]', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}