export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'overview'

    const [
      productCount,
      customerCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
    ])

    const storeData = {
      overview: {
        products: productCount,
        customers: customerCount,
        orders: 0,
        revenue: 0,
        pageViews: 0,
        conversionRate: 0,
      },
      products: [],
      orders: [],
    }

    return NextResponse.json(storeData)
  } catch (error) {
    console.error('Error fetching store data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, price, sku, category, status, featured } = body

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    const product = {
      id: Date.now().toString(),
      name,
      description,
      price: parseFloat(price),
      sku,
      category,
      status: status || 'draft',
      featured: featured || false,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}