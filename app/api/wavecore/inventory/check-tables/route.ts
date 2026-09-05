export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Product'`)
    return NextResponse.json({ columns: result.rows.map(r => r.column_name) })
  } catch (error) {
    return NextResponse.json({ error: 'Product table missing' })
  }
}