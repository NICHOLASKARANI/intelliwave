import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT * FROM "TaxRate" ORDER BY "createdAt" ASC`
    )
    return NextResponse.json({ taxes: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch taxes: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await pool.query(
      `INSERT INTO "TaxRate" (name, rate, type, active, "createdAt")
       VALUES ($1, $2, $3, true, NOW())
       RETURNING *`,
      [body.name, parseFloat(body.rate) || 0, body.type || 'VAT']
    )
    return NextResponse.json({ tax: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tax: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "TaxRate" WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tax: ' + error.message }, { status: 500 })
  }
}