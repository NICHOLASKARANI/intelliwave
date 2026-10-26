import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { put } from '@vercel/blob'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const password = formData.get('password') as string
    const adminPassword = process.env.SHOP_ADMIN_PASSWORD

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const store = formData.get('store') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = formData.get('price') as string
    const category = formData.get('category') as string
    const subCategory = formData.get('subCategory') as string
    const image = formData.get('image') as File

    if (!image || !name || !price) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 1. Upload image to Vercel Blob (Server-side)
    const filename = `${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const blob = await put(filename, image, { access: 'public' })
    const imageUrl = blob.url

    // 2. Save to Database
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ShopProduct" (id, store, name, description, price, "imageUrl", category, "subCategory") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, store, name, description, price, imageUrl, category, subCategory]
    )

    return NextResponse.json({ success: true, product: { id, name, imageUrl } })
  } catch (error) {
    console.error('Shop upload error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + (error as Error).message }, { status: 500 })
  }
}