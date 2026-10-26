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

    // 1. Find the product to get its image URL
    const res = await pool.query('SELECT "imageUrl" FROM "ShopProduct" WHERE id = $1', [params.id])
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const imageUrl = res.rows[0].imageUrl

    // 2. Delete the image from Vercel Blob
    if (imageUrl && imageUrl.startsWith('http')) {
      await del(imageUrl).catch(err => console.error('Blob delete failed:', err))
    }

    // 3. Delete the product from the database
    await pool.query('DELETE FROM "ShopProduct" WHERE id = $1', [params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}