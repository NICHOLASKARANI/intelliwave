export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Helper to ensure Category table exists
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

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ensure table exists
    await ensureCategoryTable()

    // Get categories from Category table, with product counts from Product table
    const result = await pool.query(`
      SELECT c.id, c.name, c."createdAt",
        (SELECT COUNT(*) FROM "Product" p WHERE p.category = c.name AND p."organizationId" = $1) as "productCount"
      FROM "Category" c
      WHERE c."organizationId" = $1 OR c."organizationId" IS NULL
      ORDER BY c.name ASC
    `, [session.organizationId])

    // If no categories in Category table, get distinct from Product table
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
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Ensure table exists
    await ensureCategoryTable()

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Insert into Category table
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const name = searchParams.get('name')
    
    if (!id && !name) {
      return NextResponse.json({ error: 'Category ID or name required' }, { status: 400 })
    }

    // Ensure table exists
    await ensureCategoryTable()

    // Delete from Category table
    if (id) {
      await pool.query(`DELETE FROM "Category" WHERE id = $1 AND ("organizationId" = $2 OR "organizationId" IS NULL)`, [id, session.organizationId])
    } else if (name) {
      await pool.query(`DELETE FROM "Category" WHERE name = $1 AND ("organizationId" = $2 OR "organizationId" IS NULL)`, [name, session.organizationId])
      
      // Also remove category from products
      await pool.query(`UPDATE "Product" SET category = NULL WHERE category = $1 AND "organizationId" = $2`, [name, session.organizationId])
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}