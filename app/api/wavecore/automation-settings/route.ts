export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: Get settings
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "AutomationSetting" WHERE "organizationId" = $1 LIMIT 1`,
      [session.organizationId]
    )

    return NextResponse.json({ settings: result.rows[0] || null })
  } catch (error) {
    return NextResponse.json({ settings: null })
  }
}

// POST/PUT: Save settings
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')

    // Check if settings exist
    const existing = await pool.query(
      `SELECT id FROM "AutomationSetting" WHERE "organizationId" = $1`,
      [session.organizationId]
    )

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE "AutomationSetting" SET notifications = $1, "autoRetry" = $2, "maxRetries" = $3, "webhookTimeout" = $4, "updatedAt" = NOW()
         WHERE "organizationId" = $5`,
        [body.notifications, body.autoRetry, body.maxRetries, body.webhookTimeout, session.organizationId]
      )
    } else {
      await pool.query(
        `INSERT INTO "AutomationSetting" (id, "organizationId", notifications, "autoRetry", "maxRetries", "webhookTimeout", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [crypto.randomUUID(), session.organizationId, body.notifications, body.autoRetry, body.maxRetries, body.webhookTimeout]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}