export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'
import { pool } from '@/lib/wavecore/db'

let Tesseract: any = null
async function loadTesseract() {
  if (!Tesseract) Tesseract = await import('tesseract.js')
  return Tesseract
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const crypto = require('crypto')
  const jobId = crypto.randomUUID()

  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.imageData) return NextResponse.json({ error: 'imageData (base64) required' }, { status: 400 })

    const language = body.language || 'eng'
    const bytes = dataUrlToBytes(body.imageData)

    const { createWorker } = await loadTesseract()
    const worker = await createWorker(language)
    const { data } = await worker.recognize(Buffer.from(bytes))
    await worker.terminate()

    const elapsed = Date.now() - startedAt
    const text = data.text || ''

    // Log job
    await pool.query(
      `INSERT INTO "PDFJob"
        (id, tool, "inputSize", "outputSize", status, "processingMs", options, "organizationId", "userId", "createdAt", "completedAt")
       VALUES ($1,'OCR',$2,$3,'COMPLETED',$4,$5,$6,$7,NOW(),NOW())`,
      [jobId, bytes.length, text.length, elapsed, JSON.stringify({ language }), session.organizationId, session.userId]
    ).catch(() => {})

    // If documentId passed, save OCR text into the document
    if (body.documentId) {
      await pool.query(
        `UPDATE "Document" SET "textContent" = $1, "ocrStatus" = 'COMPLETED', "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [text, body.documentId, session.organizationId]
      ).catch(() => {})

      await pool.query(
        `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", "organizationId", "createdAt")
         VALUES ($1,$2,'OCR_COMPLETED',$3,$4,$5,NOW())`,
        [crypto.randomUUID(), body.documentId, session.userId, session.name || 'User', session.organizationId]
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      jobId,
      text,
      characters: text.length,
      confidence: data.confidence || 0,
      language,
      processingMs: elapsed,
    })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ error: 'OCR failed: ' + (error as Error).message }, { status: 500 })
  }
}