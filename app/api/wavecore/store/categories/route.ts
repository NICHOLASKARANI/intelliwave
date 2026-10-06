export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureCategoryTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "organizationId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_category_org" ON "Category" ("organizationId")`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_category_name" ON "Category" (name)`)
    return true
  } catch (error) {
    console.error('Failed to create Category table:', error)
    return false
  }
}

/**
 * GET /api/wavecore/store/categories
 * GET /api/wavecore/store/categories?name=Electronics   → products in that category
 *
 * Default: all categories with product counts.
 * With ?name=: returns the products whose Product.category = name.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureCategoryTable()

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    // Drill-down: return products in the given category
    if (name) {
      const productsRes = await pool.query(`
        SELECT
          p.id,
          p.name,
          p.sku,
          p.category,
          p."sellingPrice",
          p."costPrice",
          COALESCE(SUM(sq.quantity), 0) AS stock_level
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 AND p.category = $2
        GROUP BY p.id
        ORDER BY p.name ASC
      `, [session.organizationId, name])
      return NextResponse.json({ products: productsRes.rows, category: name })
    }

    // Default: list categories
    const result = await pool.query(`
      SELECT c.id, c.name, c."createdAt",
        (SELECT COUNT(*) FROM "Product" p WHERE p.category = c.name AND p."organizationId" = $1) as "productCount"
      FROM "Category" c
      WHERE c."organizationId" = $1 OR c."organizationId" IS NULL
      ORDER BY c.name ASC
    `, [session.organizationId])

    if (result.rows.length === 0) {
      const productCategories = await pool.query(`
        SELECT DISTINCT category as name, category as id,
          COUNT(*) as "productCount"
        FROM "Product"
        WHERE "organizationId" = $1 AND category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY category ASC
      `, [session.organizationId])
      return NextResponse.json({ categories: productCategories.rows })
    }

    return NextResponse.json({ categories: result.rows })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ categories: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const name = body.name?.trim()
    if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 })

    await ensureCategoryTable()

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "Category" (id, name, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `, [id, name, session.organizationId])

    return NextResponse.json({
      category: result.rows[0],
      message: 'Category created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * DELETE /api/wavecore/store/categories?id=X&name=Y
 *
 * Works for both real Category rows and derived categories:
 *  - if a real row matches id or name, delete it
 *  - always clear Product.category for the given name so the derived
 *    category disappears from the fallback query too
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const name = searchParams.get('name')

    if (!id && !name) return NextResponse.json({ error: 'Category ID or name required' }, { status: 400 })

    await ensureCategoryTable()

    let removed = 0

    // Delete from Category table by id (if it's a real row)
    if (id) {
      const r = await pool.query(
        `DELETE FROM "Category" WHERE id = $1 AND ("organizationId" = $2 OR "organizationId" IS NULL)`,
        [id, session.organizationId]
      )
      removed += r.rowCount || 0
    }

    // Delete from Category table by name
    if (name) {
      const r = await pool.query(
        `DELETE FROM "Category" WHERE name = $1 AND ("organizationId" = $2 OR "organizationId" IS NULL)`,
        [name, session.organizationId]
      )
      removed += r.rowCount || 0

      // Clear the category from products (so a derived category disappears)
      await pool.query(
        `UPDATE "Product" SET category = NULL WHERE category = $1 AND "organizationId" = $2`,
        [name, session.organizationId]
      )
    }

    return NextResponse.json({
      success: true,
      removedCategories: removed,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}