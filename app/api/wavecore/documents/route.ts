export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: List documents with filters
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
    const folderId = searchParams.get('folderId')
    const status = searchParams.get('status')
    const starred = searchParams.get('starred')
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)

    let sql = `SELECT d.*, f.name AS "folderName"
               FROM "Document" d
               LEFT JOIN "DocumentFolder" f ON f.id = d."folderId" AND f."organizationId" = d."organizationId"
               WHERE d."organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (d.name ILIKE $${idx} OR d.description ILIKE $${idx} OR d.tags ILIKE $${idx} OR d."textContent" ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (category && category !== 'ALL') { sql += ` AND d.category = $${idx++}`; params.push(category) }
    if (folderId) { sql += ` AND d."folderId" = $${idx++}`; params.push(folderId) }
    if (status && status !== 'ALL') { sql += ` AND d.status = $${idx++}`; params.push(status) }
    if (starred === 'true') { sql += ` AND d."isStarred" = true` }

    sql += ` ORDER BY d."createdAt" DESC LIMIT $${idx}`
    params.push(limit)

    const result = await pool.query(sql, params)
    const documents = result.rows.map(d => ({
      ...d,
      fileSize: Number(d.fileSize || 0),
      currentVersion: Number(d.currentVersion || 1),
      isStarred: Boolean(d.isStarred),
      isArchived: Boolean(d.isArchived),
    }))

    // Summary KPIs
    const statsRes = await pool.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "isStarred" = true) AS starred,
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days') AS recent,
        COUNT(*) FILTER (WHERE "isArchived" = true) AS archived,
        COALESCE(SUM("fileSize"), 0) AS total_bytes
       FROM "Document" WHERE "organizationId" = $1`,
      [orgId]
    )
    const stats = statsRes.rows[0] || {}

    // Category breakdown
    const catRes = await pool.query(
      `SELECT category, COUNT(*) AS count FROM "Document"
       WHERE "organizationId" = $1 GROUP BY category ORDER BY count DESC LIMIT 20`,
      [orgId]
    )

    const summary = {
      total: Number(stats.total || 0),
      starred: Number(stats.starred || 0),
      recent: Number(stats.recent || 0),
      archived: Number(stats.archived || 0),
      totalBytes: Number(stats.total_bytes || 0),
      totalMB: Math.round((Number(stats.total_bytes || 0) / 1024 / 1024) * 10) / 10,
    }

    return NextResponse.json({ documents, summary, categories: catRes.rows })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ documents: [], summary: {}, categories: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Create document (metadata + optional file data URL)
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Document name required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Document"
        (id, name, "fileName", "fileUrl", "mimeType", "fileSize", "folderId", category, tags,
         description, "currentVersion", "isStarred", status, "expiryDate", "retentionUntil",
         "ocrStatus", "organizationId", "uploadedBy", "uploadedByName", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,false,'ACTIVE',$11,$12,'PENDING',$13,$14,$15,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.name.trim(),
        body.fileName || body.name.trim(),
        body.fileUrl || null,
        body.mimeType || 'application/octet-stream',
        Number(body.fileSize || 0),
        body.folderId || null,
        body.category || 'GENERAL',
        body.tags || null,
        body.description || null,
        body.expiryDate || null,
        body.retentionUntil || null,
        session.organizationId,
        session.userId,
        session.name || 'User',
      ]
    )

    // Log activity
    await pool.query(
      `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", "organizationId", "createdAt")
       VALUES ($1,$2,'CREATED',$3,$4,$5,NOW())`,
      [crypto.randomUUID(), id, session.userId, session.name || 'User', session.organizationId]
    ).catch(() => {})

    return NextResponse.json({ document: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}