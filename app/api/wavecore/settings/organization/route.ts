import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.organizationSetting.findFirst({
      orderBy: { id: 'asc' },
    })
    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const existing = await prisma.organizationSetting.findFirst()
    
    if (existing) {
      const updated = await prisma.organizationSetting.update({
        where: { id: existing.id },
        data: {
          companyname: body.companyname,
          email: body.email,
          phone: body.phone,
          address: body.address,
          website: body.website,
          timezone: body.timezone,
          language: body.language,
          currency: body.currency,
          dateformat: body.dateformat,
          currencysymbol: body.currencysymbol,
          numberformat: body.numberformat,
        },
      })
      return NextResponse.json({ settings: updated })
    } else {
      const created = await prisma.organizationSetting.create({
        data: {
          companyname: body.companyname || 'WaveCore ERP',
          email: body.email,
          phone: body.phone,
          address: body.address,
          website: body.website,
          timezone: body.timezone || 'Africa/Nairobi',
          language: body.language || 'English',
          currency: body.currency || 'KES',
          dateformat: body.dateformat || 'DD/MM/YYYY',
          currencysymbol: body.currencysymbol || 'KSh',
          numberformat: body.numberformat || '1,234.56',
        },
      })
      return NextResponse.json({ settings: created }, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}