export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "ProjectFile" ORDER BY "createdAt" DESC LIMIT 100`)
    return NextResponse.json({ documents: result.rows })
  } catch (error: any) {
    console.error('Documents GET:', error.message)
    return NextResponse.json({ documents: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.url) {
      return NextResponse.json({ error: 'Name and URL required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO "ProjectFile" ("id", "name", "url", "type", "size", "projectId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NULL, NOW()) 
       RETURNING "id", "name", "url", "type", "size", "createdAt"`,
      [body.name, body.url, body.type || 'DOCUMENT', parseInt(body.size) || 0]
    )

    return NextResponse.json({ success: true, document: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Documents POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}