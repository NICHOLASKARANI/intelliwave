export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('wavecore_session')?.value

    if (sessionToken) {
      await pool.query(`DELETE FROM "Session" WHERE "sessionToken" = $1`, [sessionToken])
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('wavecore_session')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('wavecore_session')?.value

    if (sessionToken) {
      await pool.query(`DELETE FROM "Session" WHERE "sessionToken" = $1`, [sessionToken])
    }

    const response = NextResponse.redirect(new URL('/wavecore-erp/auth/login', request.url))
    response.cookies.delete('wavecore_session')
    return response
  } catch (error) {
    return NextResponse.redirect(new URL('/wavecore-erp/auth/login', request.url))
  }
}