import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { action: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({ where }),
    ])
    
    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Audit log fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const log = await prisma.auditLog.create({
      data: {
        action: body.action,
        entityType: body.entityType || null,
        entityId: body.entityId || null,
        changes: body.changes || null,
        userId: body.userId || null,
      },
    })
    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}