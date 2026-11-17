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
    const status = searchParams.get('status')

    let sql = `SELECT * FROM "KnowledgeArticle" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (title ILIKE $${idx} OR body ILIKE $${idx} OR tags ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (category && category !== 'ALL') { sql += ` AND category = $${idx++}`; params.push(category) }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }

    sql += ` ORDER BY "updatedAt" DESC LIMIT 500`

    const res = await pool.query(sql, params)
    const articles = res.rows

    const published = articles.filter(a => a.status === 'PUBLISHED')
    const drafts = articles.filter(a => a.status === 'DRAFT')
    const totalViews = articles.reduce((s, a) => s + Number(a.views || 0), 0)
    const totalHelpful = articles.reduce((s, a) => s + Number(a.helpful || 0), 0)

    const summary = {
      total: articles.length,
      published: published.length,
      drafts: drafts.length,
      totalViews,
      totalHelpful,
      avgViews: articles.length > 0 ? Math.round(totalViews / articles.length) : 0,
    }

    return NextResponse.json({ articles, summary })
  } catch (error) {
    console.error('KB GET error:', error)
    return NextResponse.json({ articles: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
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

    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const result = await pool.query(
      `INSERT INTO "KnowledgeArticle"
        (id, title, slug, category, body, tags, status, views, helpful, "notHelpful",
         "authorId", "authorName", "organizationId", "publishedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,0,$8,$9,$10,$11,NOW(),NOW())
       RETURNING *`,
      [
        id, body.title.trim(), slug, body.category || 'GENERAL',
        body.body.trim(), body.tags || null, body.status || 'DRAFT',
        session.userId, session.name || 'User', session.organizationId,
        body.status === 'PUBLISHED' ? new Date().toISOString() : null,
      ]
    )

    return NextResponse.json({ article: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('KB POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}