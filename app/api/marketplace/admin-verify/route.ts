export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
  
  if (body.password === adminPassword) {
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Access denied' }, { status: 401 })
}