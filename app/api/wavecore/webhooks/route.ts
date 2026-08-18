export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

const webhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).default(['*']),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const result = await pool.query(
      `SELECT id, name, url, events, "isActive", "createdAt"
       FROM "Webhook"
       WHERE "organizationId" = $1
       ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    // Don't return secrets
    const webhooks = result.rows.map(w => ({ ...w, secret: undefined }))

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Webhooks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const validated = webhookSchema.parse(body)

    const secret = crypto.randomBytes(32).toString('hex')

    const result = await pool.query(
      `INSERT INTO "Webhook" (id, "organizationId", name, url, secret, events, "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, name, url, events`,
      [session.organizationId, validated.name, validated.url, secret, validated.events]
    )

    return NextResponse.json({ success: true, webhook: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Webhooks POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}