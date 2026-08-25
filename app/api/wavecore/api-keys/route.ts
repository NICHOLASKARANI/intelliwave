export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const result = await pool.query(
      `SELECT id, name, prefix, "lastUsedAt", "createdAt"
       FROM "ApiKey"
       WHERE "organizationId" = $1 AND "isActive" = true
       ORDER BY "createdAt" DESC`,
      [session!.organizationId]
    )

    return NextResponse.json({ apiKeys: result.rows })
  } catch (error) {
    console.error('API Keys GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const apiKey = `wc_${crypto.randomBytes(24).toString('hex')}`
    const prefix = apiKey.substring(0, 12) + '...'

    await pool.query(
      `INSERT INTO "ApiKey" (id, "organizationId", name, key, prefix, "isActive", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW())`,
      [session!.organizationId, name, apiKey, prefix]
    )

    // Return full key only once
    return NextResponse.json({
      success: true,
      apiKey: { name, key: apiKey, prefix },
    }, { status: 201 })
  } catch (error) {
    console.error('API Keys POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}