import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const folderId = url.searchParams.get('folderId')
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')
    const starred = url.searchParams.get('starred') === 'true'
    const archived = url.searchParams.get('archived') === 'true'
    const trashed = url.searchParams.get('trashed') === 'true'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500)

    let query = `SELECT id, "organizationId", "folderId", "fileName", "originalName", "mimeType", 
                        "fileSize", "fileUrl", "thumbnailUrl", category, tags, description,
                        "ocrStatus", "isStarred", "isArchived", "isTrashed", "ownerId", "ownerName",
                        version, "createdAt", "updatedAt"
                 FROM "Document" WHERE "organizationId" = $1 AND "isTrashed" = $2`
    const params: any[] = [session.organizationId, trashed]

    if (folderId) { query += ` AND "folderId" = $${params.length + 1}`; params.push(folderId) }
    if (category) { query += ` AND category = $${params.length + 1}`; params.push(category) }
    if (starred) { query += ` AND "isStarred" = true` }
    if (archived !== null) { query += ` AND "isArchived" = $${params.length + 1}`; params.push(archived) }
    if (search) {
      query += ` AND ("originalName" ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1} OR "contentText" ILIKE $${params.length + 1})`
      params.push('%' + search + '%')
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    // Stats
    const statsRes = await pool.query(
      `SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE "isStarred" = true)::int as starred,
        COUNT(*) FILTER (WHERE "isTrashed" = true)::int as trashed,
        COUNT(*) FILTER (WHERE "isArchived" = true)::int as archived,
        COALESCE(SUM("fileSize"), 0)::bigint as totalSize
       FROM "Document" WHERE "organizationId" = $1`,
      [session.organizationId]
    )
    const stats = statsRes.rows[0]

    return NextResponse.json({ documents: result.rows, stats })
  } catch (err) {
    console.error('[documents GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { fileName, originalName, mimeType, fileSize, fileUrl, blobKey, folderId, category, description, tags } = body

    if (!fileName || !originalName || !fileUrl) {
      return NextResponse.json({ error: 'fileName, originalName, and fileUrl are required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "Document"
        (id, "organizationId", "folderId", "fileName", "originalName", "mimeType", "fileSize",
         "fileUrl", "blobKey", category, tags, description, "ocrStatus",
         "isStarred", "isArchived", "isTrashed", "ownerId", "ownerName", version, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'NONE',
               false, false, false, $13, $14, 1, NOW(), NOW())`,
      [id, session.organizationId, folderId || null, fileName, originalName, 
       mimeType || 'application/octet-stream', Number(fileSize) || 0, fileUrl, blobKey || null,
       category || null, tags || null, description || null,
       session.userId, session.name || 'User']
    )

    const result = await pool.query(`SELECT * FROM "Document" WHERE id = $1`, [id])
    return NextResponse.json({ document: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[documents POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}