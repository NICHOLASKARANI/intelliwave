import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
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

    // 1. Save image to public folder
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
    const dir = join(process.cwd(), 'public', 'uploads', 'shop')
    await mkdir(dir, { recursive: true })
    
    const ext = image.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${ext}`
    const filepath = join(dir, filename)
    
    await writeFile(filepath, buffer)
    const imageUrl = `/uploads/shop/${filename}`

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
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}