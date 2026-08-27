export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const PRODUCTS = [
  { name: 'Milk 500ml', category: 'Dairy', manufacturer: 'Brookside' },
  { name: 'Bread White', category: 'Bakery', manufacturer: 'Broadways' },
  { name: 'Cooking Oil 1L', category: 'Groceries', manufacturer: 'Bidco' },
  { name: 'Sugar 2kg', category: 'Groceries', manufacturer: 'Mumias' },
  { name: 'Rice 5kg', category: 'Grains', manufacturer: 'Mwea' },
  { name: 'Soap Bar', category: 'Personal Care', manufacturer: 'Unilever' },
  { name: 'Salt 500g', category: 'Spices', manufacturer: 'Kensalt' },
  { name: 'Tea Leaves 250g', category: 'Beverages', manufacturer: 'Kericho Gold' },
]

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
    
    const result = {
      barcode: '616' + String(1000000000 + Math.floor(Math.random() * 8999999999)),
      productName: product.name,
      category: product.category,
      price: Math.floor(50 + Math.random() * 500),
      quantity: Math.floor(1 + Math.random() * 100),
      manufacturer: product.manufacturer,
      confidence: 0.9 + Math.random() * 0.09,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, product: result })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}