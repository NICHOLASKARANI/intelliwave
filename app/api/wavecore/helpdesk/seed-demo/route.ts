export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

const SEED_TAG = 'SEED'

const DEMO_TICKETS = [
  { subject: 'Cannot log in to my account', description: 'Password reset email never arrives. Urgent, need access today.', priority: 'URGENT', status: 'OPEN', category: 'TECHNICAL', assignee: 'Alice Mwangi', rating: null, hasFirstResponse: false, hasResolved: false, overdueByHours: 3 },
  { subject: 'M-Pesa payment did not reflect', description: 'Charged KSh 5,000 but invoice still shows unpaid.', priority: 'HIGH', status: 'IN_PROGRESS', category: 'BILLING', assignee: 'Alice Mwangi', rating: null, hasFirstResponse: true, hasResolved: false, overdueByHours: 0 },
  { subject: 'How do I export reports to Excel?', description: 'Looking for the export option in the Reports module.', priority: 'MEDIUM', status: 'RESOLVED', category: 'FAQ', assignee: 'Brian Otieno', rating: 5, hasFirstResponse: true, hasResolved: true, responseHours: 2, resolutionHours: 6 },
  { subject: 'Bug: inventory counts show wrong numbers', description: 'Stock count variance appears off by double.', priority: 'HIGH', status: 'RESOLVED', category: 'TECHNICAL', assignee: 'Brian Otieno', rating: 4, hasFirstResponse: true, hasResolved: true, responseHours: 1, resolutionHours: 18 },
  { subject: 'Request: add bulk customer import', description: 'We have 500 customers in Excel, need to import.', priority: 'MEDIUM', status: 'OPEN', category: 'FEATURE', assignee: 'Catherine Njeri', rating: null, hasFirstResponse: true, hasResolved: false, overdueByHours: 0 },
  { subject: 'Subscription renewal question', description: 'How do I upgrade from Starter to Pro plan?', priority: 'LOW', status: 'RESOLVED', category: 'BILLING', assignee: 'Alice Mwangi', rating: 5, hasFirstResponse: true, hasResolved: true, responseHours: 0.5, resolutionHours: 3 },
  { subject: 'Profile picture upload fails', description: 'Getting error every time I try to upload a JPG.', priority: 'MEDIUM', status: 'RESOLVED', category: 'ACCOUNT', assignee: 'Brian Otieno', rating: 3, hasFirstResponse: true, hasResolved: true, responseHours: 4, resolutionHours: 30 },
  { subject: 'API rate limit exceeded', description: 'Our integration is hitting rate limits at peak hours.', priority: 'URGENT', status: 'IN_PROGRESS', category: 'TECHNICAL', assignee: 'Catherine Njeri', rating: null, hasFirstResponse: true, hasResolved: false, overdueByHours: 8 },
]

/**
 * POST /api/wavecore/helpdesk/seed-demo
 * Creates 8 demo tickets tagged SEED. Idempotent per request — will
 * append another batch if clicked twice. Use DELETE to clear all.
 *
 * DELETE /api/wavecore/helpdesk/seed-demo
 * Removes every SupportTicket whose tags = 'SEED' for the caller's org.
 * Safe: only touches seeded rows.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const crypto = require('crypto')
    const now = Date.now()

    let created = 0
    for (const t of DEMO_TICKETS) {
      const id = crypto.randomUUID()
      const createdAt = new Date(now - (Math.random() * 7 + 1) * 86400000)  // 1-8 days ago
      const dueAt = new Date(createdAt.getTime() + 24 * 3600000)            // 24h SLA
      // Optionally set dueAt in the past to force overdue
      if (t.overdueByHours > 0) {
        dueAt.setTime(now - t.overdueByHours * 3600000)
      }
      const firstResponseAt = t.hasFirstResponse
        ? new Date(createdAt.getTime() + (t.responseHours || 2) * 3600000)
        : null
      const resolvedAt = t.hasResolved
        ? new Date(createdAt.getTime() + (t.resolutionHours || 12) * 3600000)
        : null

      await pool.query(
        `INSERT INTO "SupportTicket"
           (id, subject, description, priority, status, "userId", "organizationId",
            "customerName", "customerEmail", "customerPhone",
            category, subcategory, channel, tags, "assigneeId", "assigneeName", "dueAt",
            "firstResponseAt", "resolvedAt", "satisfactionRating",
            "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())`,
        [
          id,
          t.subject,
          t.description,
          t.priority,
          t.status,
          session.userId,
          orgId,
          t.subject.split(' ')[0] + ' Customer',   // fake customer name derived from subject
          'customer@example.com',
          '+254700000000',
          t.category,
          null,
          'EMAIL',
          SEED_TAG,
          'demo-' + t.assignee.replace(/\s+/g, '-').toLowerCase(),
          t.assignee,
          dueAt,
          firstResponseAt,
          resolvedAt,
          t.rating,
          createdAt,
        ]
      ).catch((e: any) => { console.error('[seed-demo]', e.message) })
      created++
    }

    return NextResponse.json({ created, message: 'Seeded ' + created + ' demo tickets. Refresh the page or wait 30s.' }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seeding failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    // Remove child rows first
    const idsRes = await pool.query(
      `SELECT id FROM "SupportTicket" WHERE "organizationId" = $1 AND tags = $2`,
      [orgId, SEED_TAG]
    )
    const ids = idsRes.rows.map((r: any) => r.id)

    if (ids.length > 0) {
      await pool.query(`DELETE FROM "TicketComment" WHERE "ticketId" = ANY($1::text[])`, [ids]).catch(() => {})
      await pool.query(`DELETE FROM "TicketAttachment" WHERE "ticketId" = ANY($1::text[])`, [ids]).catch(() => {})
      await pool.query(`DELETE FROM "SupportTicket" WHERE "organizationId" = $1 AND id = ANY($2::text[])`, [orgId, ids])
    }

    return NextResponse.json({ removed: ids.length, message: 'Removed ' + ids.length + ' demo tickets.' })
  } catch (error) {
    console.error('Unseed error:', error)
    return NextResponse.json({ error: 'Cleanup failed: ' + (error as Error).message }, { status: 500 })
  }
}