import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const taxes = await prisma.taxRate.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ taxes })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch taxes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const tax = await prisma.taxRate.create({
      data: {
        name: body.name,
        rate: parseFloat(body.rate) || 0,
        type: body.type || 'VAT',
        active: true,
      },
    })
    return NextResponse.json({ tax }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tax' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.taxRate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tax' }, { status: 500 })
  }
}