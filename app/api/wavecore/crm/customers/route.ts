export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  type: z.string().default('INDIVIDUAL'),
  status: z.string().default('ACTIVE'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    const result = await pool.query(
      `SELECT * FROM "Customer"
       WHERE "organizationId" = $1
       AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
       ORDER BY "createdAt" DESC
       LIMIT $3`,
      [session.organizationId, `%${search}%`, limit]
    )

    return NextResponse.json({ customers: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = customerSchema.parse(body)

    const crypto = require('crypto')
    const customerId = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Customer" 
       (id, name, email, phone, company, address, city, country, type, status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        customerId,
        validated.name,
        validated.email || null,
        validated.phone || null,
        validated.company || null,
        validated.address || null,
        validated.city || null,
        validated.country || null,
        validated.type,
        validated.status,
        session.organizationId,
      ]
    )

    return NextResponse.json({ customer: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Customer create error:', error)
    return NextResponse.json({ error: 'Failed to create customer: ' + error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const result = await pool.query(
      `UPDATE "Customer" 
       SET name = $1, email = $2, phone = $3, company = $4, address = $5, city = $6, country = $7, "updatedAt" = NOW()
       WHERE id = $8 AND "organizationId" = $9
       RETURNING *`,
      [body.name, body.email, body.phone, body.company, body.address, body.city, body.country, body.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ customer: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const result = await pool.query(
      `DELETE FROM "Customer" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer: ' + error.message }, { status: 500 })
  }
}