export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const result = await pool.query('SELECT * FROM "Customer" WHERE "organizationId" = $1 LIMIT 50', [session.organizationId])
    return NextResponse.json({ customers: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()
    const result = await pool.query(
      'INSERT INTO "Customer" (id, name, email, type, status, "organizationId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name',
      [body.name, body.email || null, 'INDIVIDUAL', 'ACTIVE', session.organizationId]
    )
    return NextResponse.json({ success: true, customer: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}