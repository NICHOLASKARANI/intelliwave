export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generateReferralCode(name: string): string {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3)
  const num = Math.floor(1000 + Math.random() * 9000)
  return initials + num
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, phone, location, password } = body

    if (!full_name || !email || !phone || !location || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be 8+ characters' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM "ExecutiveLeader" WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An application with this email already exists' }, { status: 409 })
    }

    const id = crypto.randomUUID()
    const password_hash = await bcrypt.hash(password, 10)
    let referral_code = generateReferralCode(full_name)
    // Ensure uniqueness
    for (let i = 0; i < 5; i++) {
      const check = await pool.query('SELECT id FROM "ExecutiveLeader" WHERE "referral_code" = $1', [referral_code])
      if (check.rows.length === 0) break
      referral_code = generateReferralCode(full_name)
    }

    await pool.query(
      `INSERT INTO "ExecutiveLeader" (id, full_name, email, phone, location, password_hash, referral_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, full_name, email.toLowerCase(), phone, location, password_hash, referral_code]
    )

    return NextResponse.json({ success: true, id, message: 'Application submitted. You will be notified once approved.' }, { status: 201 })
  } catch (error) {
    console.error('Apply error:', error)
    return NextResponse.json({ error: 'Application failed' }, { status: 500 })
  }
}