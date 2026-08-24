export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, email, "createdAt", 0 as "riskScore" FROM "User" ORDER BY "createdAt" DESC LIMIT 100`
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Security users error:', error)
    return NextResponse.json({ users: [] })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "User" WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}