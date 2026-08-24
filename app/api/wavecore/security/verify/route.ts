export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password } = body
    
    const adminPassword = process.env.SECURITY_ADMIN_PASSWORD
    
    if (!adminPassword) {
      return NextResponse.json({ error: 'Security password not configured' }, { status: 500 })
    }
    
    if (password === adminPassword) {
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}