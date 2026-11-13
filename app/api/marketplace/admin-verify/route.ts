export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

// Admin password gate for image moderation tool.
// This is intentionally NOT session-based — it's a separate hard-coded admin password.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    const nuclearPassword = process.env.NUCLEAR_ADMIN_PASSWORD
    const validPasswords = [adminPassword, nuclearPassword].filter(Boolean)
    if (validPasswords.length === 0) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }

    

    if (validPasswords.includes(body.password)) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}