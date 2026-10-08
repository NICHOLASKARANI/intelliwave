export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { checkCsrf } from '@/lib/wavecore/csrf'

// Defaults returned when no row exists yet
const DEFAULTS = {
  notifications: true,
  autoRetry: true,
  maxRetries: 3,
  webhookTimeout: 30,
}

// GET: Return the org's settings (or defaults if none saved yet)
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "AutomationSetting" WHERE "organizationId" = $1 LIMIT 1`,
      [session!.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ settings: DEFAULTS })
    }

    const row = result.rows[0]
    return NextResponse.json({
      settings: {
        notifications: row.notifications,
        autoRetry: row.autoRetry,
        maxRetries: row.maxRetries,
        webhookTimeout: row.webhookTimeout,
      },
    })
  } catch (error) {
    console.error('[settings GET]', error)
    return NextResponse.json({ settings: DEFAULTS, error: 'Failed to load settings' }, { status: 500 })
  }
}

// PUT: Upsert settings for the org (one row per org)
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const crypto = require('crypto')

    // Try update first
    const updateResult = await pool.query(
      `UPDATE "AutomationSetting"
       SET notifications = $1, "autoRetry" = $2, "maxRetries" = $3, "webhookTimeout" = $4, "updatedAt" = NOW()
       WHERE "organizationId" = $5
       RETURNING *`,
      [
        body.notifications === undefined ? true : !!body.notifications,
        body.autoRetry === undefined ? true : !!body.autoRetry,
        typeof body.maxRetries === 'number' ? body.maxRetries : 3,
        typeof body.webhookTimeout === 'number' ? body.webhookTimeout : 30,
        session!.organizationId,
      ]
    )

    if (updateResult.rows.length > 0) {
      const row = updateResult.rows[0]
      return NextResponse.json({
        settings: {
          notifications: row.notifications,
          autoRetry: row.autoRetry,
          maxRetries: row.maxRetries,
          webhookTimeout: row.webhookTimeout,
        },
      })
    }

    // No row yet — insert
    const insertResult = await pool.query(
      `INSERT INTO "AutomationSetting" (id, "organizationId", notifications, "autoRetry", "maxRetries", "webhookTimeout", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        crypto.randomUUID(),
        session!.organizationId,
        body.notifications === undefined ? true : !!body.notifications,
        body.autoRetry === undefined ? true : !!body.autoRetry,
        typeof body.maxRetries === 'number' ? body.maxRetries : 3,
        typeof body.webhookTimeout === 'number' ? body.webhookTimeout : 30,
      ]
    )

    const row = insertResult.rows[0]
    return NextResponse.json({
      settings: {
        notifications: row.notifications,
        autoRetry: row.autoRetry,
        maxRetries: row.maxRetries,
        webhookTimeout: row.webhookTimeout,
      },
    })
  } catch (error) {
    console.error('[settings PUT]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}