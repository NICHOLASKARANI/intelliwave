export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    let sql = `SELECT * FROM "CannedResponse" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (title ILIKE $${idx} OR body ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (category && category !== 'ALL') { sql += ` AND category = $${idx++}`; params.push(category) }

    sql += ` ORDER BY title ASC LIMIT 500`

    const res = await pool.query(sql, params)
    const templates = res.rows

    const summary = {
      total: templates.length,
      categories: new Set(templates.map(t => t.category).filter(Boolean)).size,
    }

    return NextResponse.json({ templates, summary })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ templates: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.title || !body.title.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    if (!body.body || !body.body.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "CannedResponse" (id, title, body, category, "shortcut", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [
        id, body.title.trim(), body.body.trim(),
        body.category || 'GENERAL', body.shortcut || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ template: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Template POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}