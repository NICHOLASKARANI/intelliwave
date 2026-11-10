export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: Fetch current seller's WhatsApp preference
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT sp."whatsappNumber", sp."mpesaNumber", u.phone AS "userPhone"
       FROM "SellerProfile" sp
       LEFT JOIN "User" u ON u.id = sp."userId"
       WHERE sp."userId" = $1
       LIMIT 1`,
      [session.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Seller profile not found. Create a listing first.' }, { status: 404 })
    }

    const row = result.rows[0]

    return NextResponse.json({
      whatsappNumber: row.whatsappNumber || null,
      mpesaNumber: row.mpesaNumber || null,
      signupPhone: row.userPhone || null,
      effectiveWhatsApp: row.whatsappNumber || row.mpesaNumber || row.userPhone || null,
      isExplicit: !!row.whatsappNumber,
    })
  } catch (error: any) {
    console.error('Seller WhatsApp GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

// PATCH: Update seller's WhatsApp number
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { whatsappNumber } = body

    // Allow null to clear the field (falls back to mpesa/phone)
    if (whatsappNumber !== null && whatsappNumber !== undefined) {
      const cleaned = String(whatsappNumber).replace(/\D/g, '')
      if (cleaned.length < 9 || cleaned.length > 15) {
        return NextResponse.json({ error: 'Invalid phone number length' }, { status: 400 })
      }
    }

    // Verify seller profile exists
    const profileRes = await pool.query(
      'SELECT id FROM "SellerProfile" WHERE "userId" = $1 LIMIT 1',
      [session.userId]
    )
    if (profileRes.rows.length === 0) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Update
    await pool.query(
      'UPDATE "SellerProfile" SET "whatsappNumber" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
      [whatsappNumber || null, session.userId]
    )

    // Return updated settings
    const result = await pool.query(
      `SELECT sp."whatsappNumber", sp."mpesaNumber", u.phone AS "userPhone"
       FROM "SellerProfile" sp
       LEFT JOIN "User" u ON u.id = sp."userId"
       WHERE sp."userId" = $1`,
      [session.userId]
    )
    const row = result.rows[0]

    return NextResponse.json({
      success: true,
      whatsappNumber: row.whatsappNumber,
      effectiveWhatsApp: row.whatsappNumber || row.mpesaNumber || row.userPhone,
      isExplicit: !!row.whatsappNumber,
    })
  } catch (error: any) {
    console.error('Seller WhatsApp PATCH error:', error?.message)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}