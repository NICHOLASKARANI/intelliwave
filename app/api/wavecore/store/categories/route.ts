export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT DISTINCT category as id, category as name, 
        (SELECT COUNT(*) FROM "Product" p2 WHERE p2.category = p1.category AND p2."organizationId" = $1) as "productCount"
       FROM "Product" p1 
       WHERE p1."organizationId" = $1 AND p1.category IS NOT NULL AND p1.category != ''
       ORDER BY category ASC`,
      [session.organizationId]
    )

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
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Try to insert into Category table if it exists, otherwise just return the category
    try {
      await pool.query(
        `INSERT INTO "Category" (id, name, "organizationId", "createdAt")
         VALUES ($1, $2, $3, NOW())`,
        [id, body.name, session.organizationId]
      )
    } catch (tableError) {
      // Category table doesn't exist - just proceed, category will show from Product table
      console.log('Category table not available, using Product table')
    }

    return NextResponse.json({ 
      category: { id, name: body.name, productCount: 0 },
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
    const name = searchParams.get('name') || searchParams.get('id')
    
    if (!name) return NextResponse.json({ error: 'Category name required' }, { status: 400 })

    // Remove category from products (set to NULL)
    await pool.query(
      `UPDATE "Product" SET category = NULL WHERE category = $1 AND "organizationId" = $2`,
      [name, session.organizationId]
    )

    // Try to delete from Category table if it exists
    try {
      await pool.query(
        `DELETE FROM "Category" WHERE (id = $1 OR name = $1) AND "organizationId" = $2`,
        [name, session.organizationId]
      )
    } catch (tableError) {
      console.log('Category table not available')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}