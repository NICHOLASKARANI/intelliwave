export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const res = await pool.query('SELECT * FROM "ExecutiveLeader" WHERE email = $1', [email.toLowerCase()])
    if (res.rows.length === 0) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const leader = res.rows[0]
    if (leader.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Your application is ' + leader.status.toLowerCase() + '. Please wait for approval.' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, leader.password_hash)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    await pool.query('UPDATE "ExecutiveLeader" SET last_login_at = NOW() WHERE id = $1', [leader.id])

    const response = NextResponse.json({
      success: true,
      leader: {
        id: leader.id,
        name: leader.full_name,
        email: leader.email,
        referral_code: leader.referral_code,
        level: leader.level,
        status: leader.status,
      },
    })

    response.cookies.set('executive_session', leader.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Executive login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}