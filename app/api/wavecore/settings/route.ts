export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: Get organization settings
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "OrganizationSetting" WHERE "organizationId" = $1 LIMIT 1`,
      [session.organizationId]
    )

    // If no settings exist, return defaults
    if (result.rows.length === 0) {
      return NextResponse.json({
        settings: {
          companyname: 'WaveCore ERP',
          email: '',
          phone: '',
          address: '',
          website: '',
          timezone: 'Africa/Nairobi',
          language: 'English',
          currency: 'KES',
          dateformat: 'DD/MM/YYYY',
          currencysymbol: 'KSh',
          numberformat: '1,234.56'
        }
      })
    }

    return NextResponse.json({ settings: result.rows[0] })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ 
      settings: {
        companyname: 'WaveCore ERP',
        email: '',
        phone: '',
        address: '',
        website: '',
        timezone: 'Africa/Nairobi',
        language: 'English',
        currency: 'KES',
        dateformat: 'DD/MM/YYYY',
        currencysymbol: 'KSh',
        numberformat: '1,234.56'
      }
    })
  }
}

// POST: Create or update organization settings
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Check if settings exist
    const existing = await pool.query(
      `SELECT id FROM "OrganizationSetting" WHERE "organizationId" = $1`,
      [session.organizationId]
    )

    let result
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
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
    } else {
      // Insert new
      result = await pool.query(
        `INSERT INTO "OrganizationSetting" (
          companyname, email, phone, address, website, timezone, 
          language, currency, dateformat, currencysymbol, numberformat, 
          "organizationId", updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
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
    }

    return NextResponse.json({ settings: result.rows[0], success: true })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Failed to save settings: ' + (error as Error).message }, { status: 500 })
  }
}