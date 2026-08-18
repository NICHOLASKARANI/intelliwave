import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Roles fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const role = await prisma.role.create({
      data: {
        name: body.name,
        description: body.description || null,
        permissions: body.permissions || [],
      },
    })
    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Role create error:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const role = await prisma.role.update({
      where: { id: parseInt(body.id) },
      data: {
        name: body.name,
        description: body.description,
        permissions: body.permissions,
      },
    })
    return NextResponse.json({ role })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}