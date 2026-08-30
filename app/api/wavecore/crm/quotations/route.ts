export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Quotation" (
        "id" TEXT NOT NULL, "number" TEXT NOT NULL, "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT DEFAULT 'DRAFT', "subtotal" DOUBLE PRECISION DEFAULT 0,
        "taxAmount" DOUBLE PRECISION DEFAULT 0, "total" DOUBLE PRECISION DEFAULT 0,
        "customerId" TEXT, "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
      )
    `)

    const result = await pool.query(
      `SELECT q.*, c.name as customer_name FROM "Quotation" q 
       LEFT JOIN "Customer" c ON c.id = q."customerId"
       WHERE q."organizationId" = $1 ORDER BY q."createdAt" DESC LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ quotations: result.rows })
  } catch (error: any) {
    console.error('Quotations GET error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const body = await request.json()
    const { customerId, items } = body

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Customer and items required' }, { status: 400 })
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Quotation" (
        "id" TEXT NOT NULL, "number" TEXT NOT NULL, "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT DEFAULT 'DRAFT', "subtotal" DOUBLE PRECISION DEFAULT 0,
        "taxAmount" DOUBLE PRECISION DEFAULT 0, "total" DOUBLE PRECISION DEFAULT 0,
        "customerId" TEXT, "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
      )
    `)

    const subtotal = items.reduce((sum: number, i: any) => sum + i.quantity * i.unitPrice, 0)
    const taxAmount = subtotal * 0.16
    const total = subtotal + taxAmount
    const number = 'QT-' + Date.now().toString().slice(-8)

    const result = await pool.query(
      `INSERT INTO "Quotation" (id, number, status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'DRAFT', $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, number, total`,
      [number, subtotal, taxAmount, total, customerId, orgId]
    )

    return NextResponse.json({ success: true, quotation: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Quotations POST error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Quotation" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}