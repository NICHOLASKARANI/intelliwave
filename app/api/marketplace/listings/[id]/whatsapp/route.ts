export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET /api/marketplace/listings/[id]/whatsapp
// Returns seller's WhatsApp number for a given listing.
// Multi-tenant safe: only returns for THIS listing's actual seller.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to contact the seller' }, { status: 401 })
    }

    const listingId = parseInt(params.id)
    if (isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 })
    }

    // Look up listing + its seller profile
    const result = await pool.query(
      `SELECT l.id, l.title, l."sellerId",
              sp."storeName", sp."whatsappNumber", sp."mpesaNumber",
              u.name AS "sellerName", u.phone AS "userPhone"
       FROM "MarketplaceListing" l
       LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
       LEFT JOIN "User" u ON u.id = l."sellerId"
       WHERE l.id = $1`,
      [listingId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const row = result.rows[0]

    // Determine WhatsApp number with fallback chain:
    // 1. SellerProfile.whatsappNumber (explicit)
    // 2. SellerProfile.mpesaNumber (fallback for existing sellers)
    // 3. User.phone (last resort)
    let rawNumber = row.whatsappNumber || row.mpesaNumber || row.userPhone || null

    if (!rawNumber) {
      return NextResponse.json({
        error: 'Seller has not provided a WhatsApp number',
        canChat: true,
        sellerName: row.storeName || row.sellerName || 'Seller',
      }, { status: 404 })
    }

    // Normalize phone number for WhatsApp
    // Strip everything except digits
    let normalized = String(rawNumber).replace(/\D/g, '')

    // Kenyan number handling:
    // - If starts with 0 (e.g., 0712345678) → replace with 254
    // - If starts with 254 → keep as is
    // - If starts with +254 → already stripped
    // - If 9 digits → assume Kenyan, prepend 254
    if (normalized.length === 10 && normalized.startsWith('0')) {
      normalized = '254' + normalized.slice(1)
    } else if (normalized.length === 9) {
      // Assume Kenyan without leading 0
      normalized = '254' + normalized
    } else if (normalized.length === 12 && normalized.startsWith('254')) {
      // Already correct
    } else if (normalized.length < 10) {
      return NextResponse.json({
        error: 'Seller WhatsApp number is invalid',
        canChat: true,
        sellerName: row.storeName || row.sellerName || 'Seller',
      }, { status: 400 })
    }
    // Else: use as-is (international numbers)

    return NextResponse.json({
      whatsapp: normalized,
      displayNumber: '+' + normalized,
      sellerName: row.storeName || row.sellerName || 'Seller',
      listingTitle: row.title,
    })
  } catch (error: any) {
    console.error('WhatsApp lookup error:', error?.message)
    return NextResponse.json({ error: 'Failed to load seller contact' }, { status: 500 })
  }
}