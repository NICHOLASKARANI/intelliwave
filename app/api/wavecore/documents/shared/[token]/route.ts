import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUBLIC ENDPOINT — no auth required
// Security: token is 48-char random hex (unguessable)
// Auto-checks: token valid + not expired + document not trashed
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token
    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 400 })
    }

    // Look up share + document
    const shareRes = await pool.query(
      `SELECT s.id, s."documentId", s."expiresAt", s.password, s."viewCount",
              d."originalName", d."fileName", d."mimeType", d."fileSize", d."fileUrl", d."isTrashed"
       FROM "DocumentShare" s
       JOIN "Document" d ON d.id = s."documentId"
       WHERE s.token = $1 LIMIT 1`,
      [token]
    )

    if (shareRes.rowCount === 0) {
      return NextResponse.json({ error: 'Document not found or link expired' }, { status: 404 })
    }

    const share = shareRes.rows[0]

    // Check expiry
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    // Check if document is trashed
    if (share.isTrashed) {
      return NextResponse.json({ error: 'Document is no longer available' }, { status: 404 })
    }

    // Increment view count
    await pool.query(
      `UPDATE "DocumentShare" SET "viewCount" = "viewCount" + 1 WHERE id = $1`,
      [share.id]
    ).catch(() => {})

    // Return SAFE public data only (no internal fields)
    return NextResponse.json({
      document: {
        originalName: share.originalName,
        fileName: share.fileName,
        mimeType: share.mimeType,
        fileSize: share.fileSize,
        fileUrl: share.fileUrl,
      },
      hasPassword: !!share.password,
    })
  } catch (err) {
    console.error('[shared document]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}