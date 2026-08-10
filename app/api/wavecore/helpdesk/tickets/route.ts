import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: any = {}
    if (status && status !== 'ALL') where.status = status
    if (priority) where.priority = priority

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, description, priority } = body

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        description,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        userId: 'default-user-id',
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}