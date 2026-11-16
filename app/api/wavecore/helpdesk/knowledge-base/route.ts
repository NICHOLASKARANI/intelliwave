import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80)
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''
    const publishedOnly = url.searchParams.get('published') === 'true'

    let query = `SELECT * FROM "KnowledgeArticle" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]

    if (publishedOnly) query += ` AND "isPublished" = true`
    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})`
      params.push('%' + search + '%')
    }

    query += ` ORDER BY "updatedAt" DESC LIMIT 100`

    const result = await pool.query(query, params)
    return NextResponse.json({ articles: result.rows })
  } catch (err) {
    console.error('[helpdesk/kb GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, content, category, tags, isPublished } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const slug = makeSlug(title)
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "KnowledgeArticle"
        (id, "organizationId", title, slug, content, category, tags, "isPublished", "authorId", "authorName", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [id, session.organizationId, title, slug, content, category || null, tags || null, !!isPublished, session.userId, session.name || 'Agent']
    )

    const result = await pool.query(`SELECT * FROM "KnowledgeArticle" WHERE id = $1`, [id])
    return NextResponse.json({ article: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[helpdesk/kb POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}