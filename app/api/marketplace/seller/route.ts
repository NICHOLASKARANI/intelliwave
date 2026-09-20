export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: Get current user's seller profile (auto-create if missing)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const sellerId = searchParams.get('sellerId') || session.userId

    const res = await pool.query(
      `SELECT sp.*, u.name as "userName", u.email, u.phone, u.image
       FROM "SellerProfile" sp
       JOIN "User" u ON sp."userId" = u.id
       WHERE sp."userId" = $1`,
      [sellerId]
    )

    if (res.rows.length === 0) return NextResponse.json({ profile: null, isOwn: sellerId === session.userId })

    return NextResponse.json({ profile: res.rows[0], isOwn: sellerId === session.userId })
  } catch (error) {
    console.error('Seller GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Create or update own seller profile
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    const existing = await pool.query(`SELECT id FROM "SellerProfile" WHERE "userId" = $1`, [session.userId])

    if (existing.rows.length === 0) {
      const crypto = require('crypto')
      const id = crypto.randomUUID()
      const slug = (body.storeName || session.name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 6)

      const result = await pool.query(
        `INSERT INTO "SellerProfile"
          (id, "userId", "organizationId", "storeName", "storeSlug", "storeBanner", "storeLogo",
           description, "businessType", "taxId", "bankAccount", "mpesaNumber", status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'ACTIVE',NOW(),NOW())
         RETURNING *`,
        [
          id, session.userId, session.organizationId,
          body.storeName || session.name || 'My Store',
          slug,
          body.storeBanner || null,
          body.storeLogo || null,
          body.description || null,
          body.businessType || 'INDIVIDUAL',
          body.taxId || null,
          body.bankAccount || null,
          body.mpesaNumber || null,
        ]
      )

      // Init wallet
      const walletId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO "SellerWallet" (id, "sellerId", "organizationId", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,NOW(),NOW())
         ON CONFLICT ("sellerId") DO NOTHING`,
        [walletId, session.userId, session.organizationId]
      )

      return NextResponse.json({ profile: result.rows[0], created: true }, { status: 201 })
    }

    // Update
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['storeName', 'storeBanner', 'storeLogo', 'description', 'businessType', 'taxId', 'bankAccount', 'mpesaNumber']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (sets.length === 0) return NextResponse.json({ profile: null, updated: false })

    sets.push(`"updatedAt" = NOW()`)
    values.push(session.userId)

    const result = await pool.query(
      `UPDATE "SellerProfile" SET ${sets.join(', ')} WHERE "userId" = $${i} RETURNING *`,
      values
    )
    return NextResponse.json({ profile: result.rows[0], updated: true })
  } catch (error) {
    console.error('Seller POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}