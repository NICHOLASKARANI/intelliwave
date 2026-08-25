export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Try to get from CustomReport table, fallback to empty
    let result
    try {
      result = await pool.query(
        `SELECT * FROM "CustomReport" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
        [session.organizationId]
      )
    } catch {
      // Table doesn't exist yet
      return NextResponse.json({ reports: [] })
    }

    return NextResponse.json({ reports: result.rows })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ reports: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    let result
    try {
      result = await pool.query(
        `INSERT INTO "CustomReport" (id, name, type, "organizationId", "createdAt")
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [id, body.name, body.type || 'Financial', session.organizationId]
      )
    } catch (err) {
      // Table doesn't exist - create it first
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "CustomReport" (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'Financial',
          "organizationId" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )
      `).catch(() => {})
      
      result = await pool.query(
        `INSERT INTO "CustomReport" (id, name, type, "organizationId", "createdAt")
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [id, body.name, body.type || 'Financial', session.organizationId]
      )
    }

    return NextResponse.json({ report: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Reports POST error:', error)
    return NextResponse.json({ error: 'Failed to create report: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    try {
      await pool.query(`DELETE FROM "CustomReport" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    } catch (err) {
      return NextResponse.json({ error: 'Table not found' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}