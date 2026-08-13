export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const orgUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT o.*, s.plan, s.status as sub_status, s.amount, s.currency as sub_currency, s."trialEndsAt"
       FROM "Organization" o
       LEFT JOIN "Subscription" s ON s."organizationId" = o.id
       WHERE o.id = $1`,
      [session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ organization: result.rows[0] })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = orgUpdateSchema.parse(body)

    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (validated.name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(validated.name) }
    if (validated.email !== undefined) { updates.push(`email = $${paramIndex++}`); params.push(validated.email) }
    if (validated.phone !== undefined) { updates.push(`phone = $${paramIndex++}`); params.push(validated.phone) }
    if (validated.address !== undefined) { updates.push(`address = $${paramIndex++}`); params.push(validated.address) }
    if (validated.currency !== undefined) { updates.push(`currency = $${paramIndex++}`); params.push(validated.currency) }
    if (validated.timezone !== undefined) { updates.push(`timezone = $${paramIndex++}`); params.push(validated.timezone) }

    updates.push(`"updatedAt" = NOW()`)
    params.push(session.organizationId)

    await pool.query(
      `UPDATE "Organization" SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    return NextResponse.json({ success: true, message: 'Settings updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}