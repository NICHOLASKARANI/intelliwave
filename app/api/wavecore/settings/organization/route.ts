export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "OrganizationSetting" WHERE "organizationId" = $1 LIMIT 1`,
      [session.organizationId]
    )

    return NextResponse.json({ settings: result.rows[0] || null })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ settings: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const existing = await pool.query(
      `SELECT id FROM "OrganizationSetting" WHERE "organizationId" = $1`,
      [session.organizationId]
    )

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE "OrganizationSetting" SET 
          companyname = $1, email = $2, phone = $3, address = $4,
          website = $5, timezone = $6, language = $7, currency = $8,
          dateformat = $9, currencysymbol = $10, numberformat = $11,
          updatedat = NOW()
        WHERE "organizationId" = $12
        RETURNING *`,
        [
          body.companyname || 'WaveCore ERP',
          body.email || '',
          body.phone || '',
          body.address || '',
          body.website || '',
          body.timezone || 'Africa/Nairobi',
          body.language || 'English',
          body.currency || 'KES',
          body.dateformat || 'DD/MM/YYYY',
          body.currencysymbol || 'KSh',
          body.numberformat || '1,234.56',
          session.organizationId
        ]
      )
      return NextResponse.json({ settings: updated.rows[0], success: true })
    } else {
      const created = await pool.query(
        `INSERT INTO "OrganizationSetting" (
          "organizationId", companyname, email, phone, address, website,
          timezone, language, currency, dateformat, currencysymbol, numberformat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          session.organizationId,
          body.companyname || 'WaveCore ERP',
          body.email || '',
          body.phone || '',
          body.address || '',
          body.website || '',
          body.timezone || 'Africa/Nairobi',
          body.language || 'English',
          body.currency || 'KES',
          body.dateformat || 'DD/MM/YYYY',
          body.currencysymbol || 'KSh',
          body.numberformat || '1,234.56'
        ]
      )
      return NextResponse.json({ settings: created.rows[0], success: true }, { status: 201 })
    }
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}