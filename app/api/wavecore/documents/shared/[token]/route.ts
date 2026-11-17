export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: Public access via share token — NO auth required
// Returns document metadata (not the file blob) so the page can render a preview
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const shareRes = await pool.query(
      `SELECT s.*, d.name, d."fileName", d."fileUrl", d."mimeType", d."fileSize", d.description, d.category
       FROM "DocumentShare" s
       JOIN "Document" d ON d.id = s."documentId" AND d."organizationId" = s."organizationId"
       WHERE s."shareToken" = $1 AND s."isActive" = true`,
      [token]
    )
    if (shareRes.rows.length === 0) {
      return NextResponse.json({ error: 'Share link invalid or expired' }, { status: 404 })
    }

    const share = shareRes.rows[0]

    // Check expiry
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      await pool.query(`UPDATE "DocumentShare" SET "isActive" = false WHERE id = $1`, [share.id]).catch(() => {})
      return NextResponse.json({ error: 'Share link expired' }, { status: 410 })
    }

    // Log activity
    const crypto = require('crypto')
    await pool.query(
      `INSERT INTO "DocumentActivity" (id, "documentId", action, details, "organizationId", "createdAt")
       VALUES ($1,$2,'SHARE_ACCESSED',$3,$4,NOW())`,
      [
        crypto.randomUUID(),
        share.documentId,
        JSON.stringify({ token: token.slice(0, 8) + '…', permission: share.permission }),
        share.organizationId,
      ]
    ).catch(() => {})

    // Return metadata — actual file served separately via /shared/[token]/file
    return NextResponse.json({
      document: {
        id: share.documentId,
        name: share.name,
        fileName: share.fileName,
        mimeType: share.mimeType,
        fileSize: share.fileSize,
        description: share.description,
        category: share.category,
        fileUrl: share.permission === 'DOWNLOAD' || share.permission === 'FULL' ? share.fileUrl : null,
      },
      permission: share.permission,
      sharedBy: share.sharedByName,
      expiresAt: share.expiresAt,
    })
  } catch (error) {
    console.error('Shared token GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}