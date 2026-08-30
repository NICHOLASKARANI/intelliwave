export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const result = await pool.query(
      'SELECT * FROM "Activity" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
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
    const orgId = session!.organizationId

    const body = await request.json()
    const { type, subject, description, customerId } = body

    if (!subject) {
      return NextResponse.json({ error: 'Subject required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO "Activity" (id, type, subject, description, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
      [type || 'NOTE', subject, description || null, customerId || null, orgId]
    )

    return NextResponse.json({ success: true, id: result.rows[0].id }, { status: 201 })
  } catch (error: any) {
    console.error('Activities POST error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Activity" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}