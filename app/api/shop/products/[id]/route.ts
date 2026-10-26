import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { del } from '@vercel/blob'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const password = searchParams.get('password')
    if (password !== process.env.SHOP_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get product to find the image URL
    const res = await pool.query('SELECT "imageUrl" FROM "ShopProduct" WHERE id = $1', [params.id])
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const imageUrl = res.rows[0].imageUrl

    // 2. Delete from Vercel Blob
    if (imageUrl && imageUrl.startsWith('http')) {
      await del(imageUrl).catch(console.error)
    }

    // 3. Delete from Database
    await pool.query('DELETE FROM "ShopProduct" WHERE id = $1', [params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    if (body.password !== process.env.SHOP_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await pool.query(
      `UPDATE "ShopProduct" 
       SET name = $1, description = $2, price = $3, category = $4, "subCategory" = $5 
       WHERE id = $6`,
      [body.name, body.description, body.price, body.category, body.subCategory, params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}