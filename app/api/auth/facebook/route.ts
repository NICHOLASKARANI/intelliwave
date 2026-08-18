import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const redirectUrl = new URL('/wavecore-erp/auth/signup', req.url)
    redirectUrl.searchParams.set('provider', 'facebook')
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    return NextResponse.json({ error: 'Facebook auth failed' }, { status: 500 })
  }
}