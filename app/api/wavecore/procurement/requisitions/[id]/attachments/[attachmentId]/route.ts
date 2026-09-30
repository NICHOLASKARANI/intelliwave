export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/requisitions/[id]/attachments/[attachmentId]
 * Streams the file back with proper Content-Disposition.
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; attachmentId: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const { id: reqId, attachmentId } = ctx.params

  const r = await pool.query(
    `SELECT "fileName", "mimeType", "fileData"
     FROM "RequisitionAttachment"
     WHERE id = $1 AND "requisitionId" = $2 AND "organizationId" = $3`,
    [attachmentId, reqId, g.organizationId]
  )
  if (r.rowCount === 0) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }
  const a = r.rows[0]
  if (!a.fileData) {
    return NextResponse.json({ error: 'File data missing' }, { status: 404 })
  }

  const buffer = Buffer.from(a.fileData, 'base64')

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': a.mimeType || 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="' + a.fileName.replace(/"/g, '') + '"',
      'Cache-Control': 'private, no-store',
    },
  })
})

/**
 * DELETE /api/wavecore/procurement/requisitions/[id]/attachments/[attachmentId]
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; attachmentId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id: reqId, attachmentId } = ctx.params

  const found = await pool.query(
    `SELECT id, "fileName" FROM "RequisitionAttachment"
     WHERE id = $1 AND "requisitionId" = $2 AND "organizationId" = $3`,
    [attachmentId, reqId, g.organizationId]
  )
  if (found.rowCount === 0) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  await pool.query(
    `DELETE FROM "RequisitionAttachment"
     WHERE id = $1 AND "requisitionId" = $2 AND "organizationId" = $3`,
    [attachmentId, reqId, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_ATTACHMENT_DELETED',
    entityType: 'PurchaseRequisition',
    entityId: reqId,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed attachment ' + found.rows[0].fileName,
    metadata: { attachmentId, fileName: found.rows[0].fileName },
  })

  return NextResponse.json({ ok: true })
})