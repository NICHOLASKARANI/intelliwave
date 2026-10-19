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
      // Set an HttpOnly session cookie so subsequent security API calls
      // are authenticated without re-sending the password manually.
      const res = NextResponse.json({ success: true })
      res.cookies.set('security_password', adminPassword, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      })
      return res
    }
    
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}