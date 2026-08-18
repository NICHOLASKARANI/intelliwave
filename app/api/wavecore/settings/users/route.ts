import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    
    const users = await prisma.userProfile.findMany({
      where: search ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.userProfile.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone || null,
        role: body.role || 'User',
        status: 'Active',
      },
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('User create error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.userProfile.update({
      where: { id: parseInt(body.id) },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        status: body.status,
      },
    })
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.userProfile.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}