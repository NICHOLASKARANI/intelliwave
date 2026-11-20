export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAuditAsync } from '@/lib/wavecore/audit'
import { logCommunication, type CommChannel, type CommDirection } from '@/lib/wavecore/crm/communications'

/**
 * GET /api/wavecore/crm/communications?customerId=X&contactId=Y&leadId=Z
 * Lists communication log entries scoped to org. Filters applied if provided.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const contactId = searchParams.get('contactId')
    const leadId = searchParams.get('leadId')
    const limit = Math.min(Number(searchParams.get('limit') || 200), 500)

    const params: any[] = [session.organizationId]
    let where = 'WHERE "organizationId" = $1'
    if (customerId) { params.push(customerId); where += ` AND "customerId" = $${params.length}` }
    if (contactId) { params.push(contactId); where += ` AND "contactId" = $${params.length}` }
    if (leadId) { params.push(leadId); where += ` AND "leadId" = $${params.length}` }

    const result = await pool.query(
      `SELECT id, "customerId", "contactId", "leadId", "opportunityId",
              channel, direction, subject, body, status, "contactName",
              "sentAt", "createdAt", "userId"
       FROM "CommunicationLog"
       ${where}
       ORDER BY "sentAt" DESC, "createdAt" DESC
       LIMIT ${limit}`,
      params
    )

    return NextResponse.json({ communications: result.rows })
  } catch (error) {
    console.error('[crm/communications GET]', error)
    return NextResponse.json({ communications: [], error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/crm/communications
 * Body: { customerId?, contactId?, leadId?, opportunityId?, channel, direction, subject?, body?, contactName? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const channel = String(body.channel || '').toUpperCase()
    const direction = String(body.direction || 'OUTBOUND').toUpperCase()

    const validChannels = ['WHATSAPP', 'EMAIL', 'SMS', 'CALL', 'MEETING', 'NOTE']
    const validDirections = ['OUTBOUND', 'INBOUND']
    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }
    if (!validDirections.includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
    }
    if (!body.customerId && !body.contactId && !body.leadId) {
      return NextResponse.json({ error: 'At least one of customerId/contactId/leadId is required' }, { status: 400 })
    }

    const id = await logCommunication({
      organizationId: session.organizationId,
      userId: session.userId,
      customerId: body.customerId || null,
      contactId: body.contactId || null,
      leadId: body.leadId || null,
      opportunityId: body.opportunityId || null,
      channel: channel as CommChannel,
      direction: direction as CommDirection,
      subject: body.subject || null,
      body: body.body || null,
      contactName: body.contactName || null,
    })
    if (!id) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

    await writeAuditAsync({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'CREATE',
      entityType: 'CommunicationLog',
      entityId: id,
      changes: { channel, direction, subject: body.subject || null, customerId: body.customerId || null },
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error('[crm/communications POST]', error)
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}