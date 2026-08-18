import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // In production, redirect to Google OAuth
    // For now, redirect to signup with Google flag
    const redirectUrl = new URL('/wavecore-erp/auth/signup', req.url)
    redirectUrl.searchParams.set('provider', 'google')
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    return NextResponse.json({ error: 'Google auth failed' }, { status: 500 })
  }
}