export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { del } from '@vercel/blob'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const password = req.headers.get('x-admin-password')
    if (password !== process.env.SHOP_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await pool.query(
      'SELECT "imageUrl" FROM "ShopProduct" WHERE id = $1',
      [params.id]
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const imageUrl = res.rows[0].imageUrl
    if (imageUrl && imageUrl.startsWith('http')) {
      await del(imageUrl).catch(err => console.error('Blob delete failed:', err))
    }

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
      `UPDATE "ShopProduct" SET name = $1, description = $2, price = $3, category = $4, "subCategory" = $5 WHERE id = $6`,
      [body.name, body.description, body.price, body.category, body.subCategory, params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed: ' + (error as Error).message }, { status: 500 })
  }
}