export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: List available ERP products that can be listed on the marketplace
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const linked = searchParams.get('linked')

    // ERP Products (from Product table)
    let query = `SELECT p.id, p.name, p.sku, p.price, p."costPrice", p.description, p.category,
                        p.stock, p."warehouseId", p.image,
                        (SELECT COUNT(*) FROM "MarketplaceListing" ml WHERE ml.sku = p.sku AND ml."organizationId" = $1) AS "marketplaceListingCount"
                 FROM "Product" p
                 WHERE p."organizationId" = $1`
    const params: any[] = [orgId]

    if (search) {
      query += ` AND (p.name ILIKE $2 OR p.sku ILIKE $2)`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY p.name ASC LIMIT 500`

    const productsRes = await pool.query(query, params).catch(() => ({ rows: [] }))
    const products = productsRes.rows

    // Warehouses for location/fulfillment
    const warehousesRes = await pool.query(
      `SELECT id, name, location, "organizationId" FROM "Warehouse" WHERE "organizationId" = $1 LIMIT 50`,
      [orgId]
    ).catch(() => ({ rows: [] }))

    // Marketplace listings already synced
    const linkedRes = await pool.query(
      `SELECT id, title, sku, stock, price, "warehouseId", status FROM "MarketplaceListing"
       WHERE "organizationId" = $1 AND sku IS NOT NULL LIMIT 500`,
      [orgId]
    ).catch(() => ({ rows: [] }))

    const summary = {
      totalProducts: products.length,
      linkedProducts: products.filter(p => Number(p.marketplaceListingCount || 0) > 0).length,
      unlinkedProducts: products.filter(p => Number(p.marketplaceListingCount || 0) === 0).length,
      totalWarehouses: warehousesRes.rows.length,
      totalMarketplaceListings: linkedRes.rows.length,
    }

    return NextResponse.json({
      products,
      warehouses: warehousesRes.rows,
      linkedListings: linkedRes.rows,
      summary,
    })
  } catch (error) {
    console.error('ERP-Sync GET error:', error)
    return NextResponse.json({ products: [], warehouses: [], linkedListings: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Sync an ERP product to the marketplace (create or update listing)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    const orgId = session.organizationId

    // Load the ERP product
    const prodRes = await pool.query(
      `SELECT * FROM "Product" WHERE id = $1 AND "organizationId" = $2`,
      [body.productId, orgId]
    )
    if (prodRes.rows.length === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const product = prodRes.rows[0]

    // Check if a listing already exists for this SKU
    const existingRes = await pool.query(
      `SELECT id FROM "MarketplaceListing" WHERE sku = $1 AND "organizationId" = $2 LIMIT 1`,
      [product.sku, orgId]
    )

    const crypto = require('crypto')
    const listingId = existingRes.rows[0]?.id
    const isUpdate = !!listingId

    // Prepare listing data
    const listingData = {
      title: body.title || product.name || 'Untitled',
      description: body.description || product.description || '',
      price: Number(body.price || product.price || 0),
      category: body.category || product.category || 'GENERAL',
      condition: body.condition || 'New',
      stock: Number(body.stock ?? product.stock ?? 1),
      sku: product.sku,
      warehouseId: body.warehouseId || product.warehouseId || null,
      fulfillmentType: body.fulfillmentType || 'ERP_WAREHOUSE',
      slaHours: Number(body.slaHours || 24),
      images: body.images || (product.image ? [product.image] : []),
      location: body.location || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
    }

    if (isUpdate) {
      // Update existing listing
      const result = await pool.query(
        `UPDATE "MarketplaceListing"
         SET title = $1, description = $2, price = $3, category = $4, condition = $5,
             stock = $6, "warehouseId" = $7, "fulfillmentType" = $8, "slaHours" = $9,
             images = $10, location = $11, latitude = $12, longitude = $13, "updatedAt" = NOW()
         WHERE id = $14 AND "organizationId" = $15
         RETURNING *`,
        [
          listingData.title, listingData.description, listingData.price,
          listingData.category, listingData.condition, listingData.stock,
          listingData.warehouseId, listingData.fulfillmentType, listingData.slaHours,
          listingData.images, listingData.location, listingData.latitude, listingData.longitude,
          listingId, orgId,
        ]
      )

      return NextResponse.json({
        listing: result.rows[0],
        action: 'updated',
        message: `Listing for "${product.name}" updated on marketplace.`,
      })
    }

    // Create new listing
    const newId = crypto.randomUUID()

    // Ensure seller profile exists for this user
    const spRes = await pool.query(`SELECT id FROM "SellerProfile" WHERE "userId" = $1`, [session.userId])
    if (spRes.rows.length === 0) {
      const spId = crypto.randomUUID()
      const slug = (session.name || 'erp-store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + spId.slice(0, 6)
      await pool.query(
        `INSERT INTO "SellerProfile" (id, "userId", "organizationId", "storeName", "storeSlug", status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,'ACTIVE',NOW(),NOW())`,
        [spId, session.userId, orgId, session.name || 'My Store', slug]
      )
    }

    const result = await pool.query(
      `INSERT INTO "MarketplaceListing"
        (id, "sellerId", title, description, price, category, condition, location, images, status,
         "organizationId", sku, stock, "warehouseId", "fulfillmentType", "slaHours",
         latitude, longitude, "publishedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE',$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW(),NOW())
       RETURNING *`,
      [
        newId, session.userId,
        listingData.title, listingData.description, listingData.price,
        listingData.category, listingData.condition, listingData.location, listingData.images,
        orgId, listingData.sku, listingData.stock, listingData.warehouseId,
        listingData.fulfillmentType, listingData.slaHours, listingData.latitude, listingData.longitude,
      ]
    )

    return NextResponse.json({
      listing: result.rows[0],
      action: 'created',
      message: `"${product.name}" now live on the marketplace.`,
    }, { status: 201 })
  } catch (error) {
    console.error('ERP-Sync POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Unlink ERP product from marketplace
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const result = await pool.query(
      `DELETE FROM "MarketplaceListing" WHERE id = $1 AND "organizationId" = $2`,
      [parseInt(listingId), session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERP-Sync DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}