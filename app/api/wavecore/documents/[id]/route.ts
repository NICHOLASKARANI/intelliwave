export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: Single document + versions + activity + shares + signatures
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const docRes = await pool.query(
      `SELECT d.*, f.name AS "folderName"
       FROM "Document" d
       LEFT JOIN "DocumentFolder" f ON f.id = d."folderId" AND f."organizationId" = d."organizationId"
       WHERE d.id = $1 AND d."organizationId" = $2`,
      [params.id, orgId]
    )
    if (docRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const safe = async (q: string, p: any[]) => {
      try { return (await pool.query(q, p)).rows } catch { return [] }
    }

    const [versions, activity, shares, signatures] = await Promise.all([
      safe(`SELECT * FROM "DocumentVersion" WHERE "documentId" = $1 AND "organizationId" = $2 ORDER BY version DESC LIMIT 50`, [params.id, orgId]),
      safe(`SELECT * FROM "DocumentActivity" WHERE "documentId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 100`, [params.id, orgId]),
      safe(`SELECT * FROM "DocumentShare" WHERE "documentId" = $1 AND "organizationId" = $2 AND "isActive" = true ORDER BY "createdAt" DESC LIMIT 100`, [params.id, orgId]),
      safe(`SELECT * FROM "DocumentSignature" WHERE "documentId" = $1 AND "organizationId" = $2 ORDER BY "requestedAt" DESC LIMIT 50`, [params.id, orgId]),
    ])

    return NextResponse.json({ document: docRes.rows[0], versions, activity, shares, signatures })
  } catch (error) {
    console.error('Document detail GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Update document (rename, move, star, archive, retag, new version)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json()

    // Fetch current for activity log
    const existing = await pool.query(
      `SELECT * FROM "Document" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (existing.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    const actions: string[] = []

    // Simple field updates
    for (const k of ['name', 'description', 'folderId', 'category', 'tags', 'status', 'mimeType', 'fileUrl', 'fileName']) {
      if (body[k] !== undefined) {
        sets.push(`"${k}" = $${i++}`)
        values.push(body[k] || null)
        actions.push(k.toUpperCase() + '_UPDATED')
      }
    }
    for (const k of ['isStarred', 'isArchived']) {
      if (body[k] !== undefined) {
        sets.push(`"${k}" = $${i++}`)
        values.push(Boolean(body[k]))
        actions.push(k === 'isStarred' ? (body[k] ? 'STARRED' : 'UNSTARRED') : (body[k] ? 'ARCHIVED' : 'UNARCHIVED'))
      }
    }
    if (body.fileSize !== undefined) { sets.push(`"fileSize" = $${i++}`); values.push(Number(body.fileSize || 0)) }
    if (body.expiryDate !== undefined) { sets.push(`"expiryDate" = $${i++}`); values.push(body.expiryDate || null) }
    if (body.retentionUntil !== undefined) { sets.push(`"retentionUntil" = $${i++}`); values.push(body.retentionUntil || null) }
    if (body.textContent !== undefined) { sets.push(`"textContent" = $${i++}`); values.push(body.textContent || null) }

    // Version bump — creates a DocumentVersion record
    if (body.newVersion) {
      const crypto = require('crypto')
      const current = existing.rows[0]
      const nextVersion = Number(current.currentVersion || 1) + 1
      const prevFileName = current.fileName
      const prevFileUrl = current.fileUrl
      const prevSize = current.fileSize
      const prevMime = current.mimeType

      // Save previous as a version snapshot
      await pool.query(
        `INSERT INTO "DocumentVersion"
          (id, "documentId", version, "fileName", "fileUrl", "fileSize", "mimeType", "changeNote",
           "organizationId", "createdBy", "createdByName", "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
        [
          crypto.randomUUID(), params.id, current.currentVersion || 1,
          prevFileName, prevFileUrl, prevSize, prevMime,
          body.changeNote || 'Previous version',
          orgId, session.userId, session.name || 'User',
        ]
      )

      sets.push(`"currentVersion" = $${i++}`)
      values.push(nextVersion)
      actions.push('VERSION_BUMPED')
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, orgId)

    const result = await pool.query(
      `UPDATE "Document" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )

    // Log activity (one row per action taken)
    const crypto = require('crypto')
    for (const action of actions) {
      await pool.query(
        `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", details, "organizationId", "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [crypto.randomUUID(), params.id, action, session.userId, session.name || 'User', JSON.stringify(body), orgId]
      ).catch(() => {})
    }

    return NextResponse.json({ document: result.rows[0], actions })
  } catch (error) {
    console.error('Document PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Hard delete document + versions + shares + signatures
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    // Cascade delete children
    await pool.query(`DELETE FROM "DocumentVersion" WHERE "documentId" = $1 AND "organizationId" = $2`, [params.id, orgId]).catch(() => {})
    await pool.query(`DELETE FROM "DocumentShare" WHERE "documentId" = $1 AND "organizationId" = $2`, [params.id, orgId]).catch(() => {})
    await pool.query(`DELETE FROM "DocumentSignature" WHERE "documentId" = $1 AND "organizationId" = $2`, [params.id, orgId]).catch(() => {})

    const result = await pool.query(
      `DELETE FROM "Document" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Log activity (document is gone, so use params.id)
    const crypto = require('crypto')
    await pool.query(
      `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", "organizationId", "createdAt")
       VALUES ($1,$2,'DELETED',$3,$4,$5,NOW())`,
      [crypto.randomUUID(), params.id, session.userId, session.name || 'User', orgId]
    ).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}