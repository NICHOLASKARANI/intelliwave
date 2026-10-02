export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

async function ensureActivitySchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Activity" (
      "id" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'NOTE',
      "subject" TEXT NOT NULL,
      "description" TEXT,
      "dueDate" TIMESTAMP(3),
      "completed" BOOLEAN DEFAULT FALSE,
      "customerId" TEXT,
      "leadId" TEXT,
      "opportunityId" TEXT,
      "assignedToId" TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
    )
  `)
  // Priority is not on the base schema — add it as an additive column for CRM UI use.
  await pool.query(`ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'MEDIUM'`)
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    await ensureActivitySchema()

    const result = await pool.query(
      `SELECT a.*, c.name AS "customerName"
       FROM "Activity" a
       LEFT JOIN "Customer" c ON c.id = a."customerId"
       WHERE a."organizationId" = $1
       ORDER BY a."createdAt" DESC
       LIMIT 100`,
      [orgId]
    )

    return NextResponse.json({ activities: result.rows })
  } catch (error: any) {
    console.error('Activities GET error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json()
    const { type, subject, description, customerId, leadId, opportunityId, dueDate, priority } = body

    if (!subject || !String(subject).trim()) {
      return NextResponse.json({ error: 'Subject required' }, { status: 400 })
    }

    await ensureActivitySchema()

    const result = await pool.query(
      `INSERT INTO "Activity"
         (id, type, subject, description, "dueDate", priority, completed,
          "customerId", "leadId", "opportunityId", "assignedToId",
          "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, FALSE,
               $6, $7, $8, $9,
               $10, NOW(), NOW())
       RETURNING *`,
      [
        type || 'NOTE',
        String(subject).trim(),
        description ? String(description) : null,
        dueDate ? new Date(dueDate) : null,
        priority || 'MEDIUM',
        customerId || null,
        leadId || null,
        opportunityId || null,
        session.userId || null,
        orgId,
      ]
    )

    return NextResponse.json({ success: true, activity: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Activities POST error:', (error as Error).message)
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await pool.query(
      `DELETE FROM "Activity" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}