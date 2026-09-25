export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'
import { pool } from '@/lib/wavecore/db'

// pdf-lib is a pure JS library for PDF manipulation
let PDFLib: any = null
async function loadPDFLib() {
  if (!PDFLib) PDFLib = await import('pdf-lib')
  return PDFLib
}

// Convert base64 data URL → Uint8Array
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}

// Convert Uint8Array → base64 data URL
function bytesToDataUrl(bytes: Uint8Array, mime = 'application/pdf'): string {
  return 'data:' + mime + ';base64,' + Buffer.from(bytes).toString('base64')
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

    const orgId = session.organizationId
    const body = await request.json()
    const tool = String(body.tool || '').toUpperCase()

    if (!tool) return NextResponse.json({ error: 'tool is required' }, { status: 400 })
    if (!body.fileData) return NextResponse.json({ error: 'fileData (base64) required' }, { status: 400 })

    const inputBytes = dataUrlToBytes(body.fileData)
    const { PDFDocument, rgb, StandardFonts, degrees } = await loadPDFLib()

    let outputBytes: Uint8Array
    let outputMime = 'application/pdf'
    let extra: any = {}

    // ==================== MERGE ====================
    if (tool === 'MERGE') {
      const inputs: string[] = Array.isArray(body.additionalFiles) ? body.additionalFiles : []
      if (inputs.length === 0) return NextResponse.json({ error: 'additionalFiles required for merge' }, { status: 400 })
      const merged = await PDFDocument.create()
      const firstDoc = await PDFDocument.load(inputBytes)
      const firstPages = await merged.copyPages(firstDoc, firstDoc.getPageIndices())
      firstPages.forEach(p => merged.addPage(p))
      for (const f of inputs) {
        const doc = await PDFDocument.load(dataUrlToBytes(f))
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      outputBytes = await merged.save()
    }
    // ==================== SPLIT ====================
    else if (tool === 'SPLIT') {
      const doc = await PDFDocument.load(inputBytes)
      const pageCount = doc.getPageCount()
      // Return first page as primary output; client can request each separately
      const pages = body.pages ? String(body.pages).split(',').map((n: string) => parseInt(n.trim()) - 1).filter((n: number) => n >= 0 && n < pageCount) : [0]
      const newDoc = await PDFDocument.create()
      const copied = await newDoc.copyPages(doc, pages)
      copied.forEach(p => newDoc.addPage(p))
      outputBytes = await newDoc.save()
      extra = { pageCount, splitPages: pages.length }
    }
    // ==================== COMPRESS ====================
    else if (tool === 'COMPRESS') {
      // Re-save with objectsPerTick + removed metadata = basic compression
      const doc = await PDFDocument.load(inputBytes, { ignoreEncryption: true })
      doc.setTitle('')
      doc.setAuthor('')
      doc.setSubject('')
      doc.setKeywords([])
      doc.setProducer('WaveCore')
      doc.setCreator('WaveCore')
      outputBytes = await doc.save({ useObjectStreams: true })
      extra = { inputSize: inputBytes.length, outputSize: outputBytes.length }
    }
    // ==================== ROTATE ====================
    else if (tool === 'ROTATE') {
      const angle = Number(body.angle || 90)
      const doc = await PDFDocument.load(inputBytes)
      for (const page of doc.getPages()) {
        const current = page.getRotation().angle
        page.setRotation(degrees((current + angle) % 360))
      }
      outputBytes = await doc.save()
      extra = { angle }
    }
    // ==================== WATERMARK ====================
    else if (tool === 'WATERMARK') {
      const text = body.text || 'CONFIDENTIAL'
      const opacity = Math.min(1, Math.max(0.05, Number(body.opacity || 0.25)))
      const fontSize = Number(body.fontSize || 60)
      const color = body.color || '#ff0000'
      const rgbColor = hexToRgb(color)

      const doc = await PDFDocument.load(inputBytes)
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize()
        page.drawText(text, {
          x: width / 4,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
          opacity,
          rotate: degrees(45),
        })
      }
      outputBytes = await doc.save()
      extra = { text, opacity }
    }
    // ==================== PAGE NUMBERS ====================
    else if (tool === 'PAGE_NUMBERS') {
      const position = body.position || 'BOTTOM_CENTER'
      const startNum = Number(body.startNumber || 1)
      const fontSize = Number(body.fontSize || 10)

      const doc = await PDFDocument.load(inputBytes)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      pages.forEach((page, idx) => {
        const { width } = page.getSize()
        const text = String(startNum + idx)
        const textWidth = font.widthOfTextAtSize(text, fontSize)
        let x = width / 2 - textWidth / 2
        if (position === 'BOTTOM_LEFT') x = 30
        if (position === 'BOTTOM_RIGHT') x = width - textWidth - 30
        page.drawText(text, {
          x,
          y: 20,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
      })
      outputBytes = await doc.save()
      extra = { position, startNumber: startNum }
    }
    // ==================== ORGANIZE (reorder/delete) ====================
    else if (tool === 'ORGANIZE') {
      const order: number[] = Array.isArray(body.pageOrder) ? body.pageOrder.map((n: any) => parseInt(n) - 1) : []
      if (order.length === 0) return NextResponse.json({ error: 'pageOrder required (1-indexed)' }, { status: 400 })

      const doc = await PDFDocument.load(inputBytes)
      const pageCount = doc.getPageCount()
      const validOrder = order.filter(n => n >= 0 && n < pageCount)

      const newDoc = await PDFDocument.create()
      const copied = await newDoc.copyPages(doc, validOrder)
      copied.forEach(p => newDoc.addPage(p))
      outputBytes = await newDoc.save()
      extra = { pageCount, newPageCount: validPages(validOrder).length }
    }
    // ==================== PROTECT (encrypt) ====================
    else if (tool === 'PROTECT') {
      const password = body.password
      if (!password) return NextResponse.json({ error: 'password required for protect' }, { status: 400 })
      // pdf-lib doesn't support encryption — return error asking for a different tool
      // Provide a clear message rather than failing silently
      return NextResponse.json({
        error: 'PDF encryption is not supported in this environment yet. Coming soon.',
        notSupported: 'PROTECT',
      }, { status: 501 })
    }
    // ==================== UNLOCK (decrypt) ====================
    else if (tool === 'UNLOCK') {
      const password = body.password || ''
      try {
        const doc = await PDFDocument.load(inputBytes, { ignoreEncryption: true, password })
        outputBytes = await doc.save()
      } catch (e) {
        return NextResponse.json({ error: 'Could not unlock PDF. Wrong password or unsupported encryption.' }, { status: 400 })
      }
    }
    // ==================== REPAIR ====================
    else if (tool === 'REPAIR') {
      try {
        // Re-parse + re-save with relaxed rules — often recovers damaged PDFs
        const doc = await PDFDocument.load(inputBytes, { ignoreEncryption: true, throwOnInvalidObject: false } as any)
        outputBytes = await doc.save()
      } catch (e) {
        return NextResponse.json({ error: 'Could not repair PDF: ' + (e as Error).message }, { status: 400 })
      }
    }
    // ==================== CROP ====================
    else if (tool === 'CROP') {
      const margins = {
        top: Number(body.top || 20),
        bottom: Number(body.bottom || 20),
        left: Number(body.left || 20),
        right: Number(body.right || 20),
      }
      const doc = await PDFDocument.load(inputBytes)
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize()
        page.setCropBox(margins.left, margins.bottom, width - margins.left - margins.right, height - margins.top - margins.bottom)
      }
      outputBytes = await doc.save()
      extra = { margins }
    }
    // ==================== REDACT (visual) ====================
    else if (tool === 'REDACT') {
      // Visual redaction: draw black rectangles over selected areas
      const areas: any[] = Array.isArray(body.areas) ? body.areas : []
      if (areas.length === 0) return NextResponse.json({ error: 'areas required (array of {page,x,y,width,height})' }, { status: 400 })

      const doc = await PDFDocument.load(inputBytes)
      const pages = doc.getPages()
      for (const area of areas) {
        const page = pages[area.page - 1]
        if (!page) continue
        page.drawRectangle({
          x: Number(area.x || 0),
          y: Number(area.y || 0),
          width: Number(area.width || 100),
          height: Number(area.height || 20),
          color: rgb(0, 0, 0),
          opacity: 1,
        })
      }
      outputBytes = await doc.save()
      extra = { areasRedacted: areas.length }
    }
    // ==================== METADATA EDIT ====================
    else if (tool === 'METADATA') {
      const doc = await PDFDocument.load(inputBytes)
      if (body.title !== undefined) doc.setTitle(body.title || '')
      if (body.author !== undefined) doc.setAuthor(body.author || '')
      if (body.subject !== undefined) doc.setSubject(body.subject || '')
      if (body.keywords !== undefined) doc.setKeywords(Array.isArray(body.keywords) ? body.keywords : [body.keywords])
      if (body.producer !== undefined) doc.setProducer(body.producer || '')
      if (body.creator !== undefined) doc.setCreator(body.creator || '')
      outputBytes = await doc.save()
      extra = { fields: Object.keys(body).filter(k => ['title', 'author', 'subject', 'keywords', 'producer', 'creator'].includes(k)) }
    }
    // ==================== UNSUPPORTED ====================
    else {
      return NextResponse.json({
        error: 'Tool "' + tool + '" not supported in this environment. Supported: MERGE, SPLIT, COMPRESS, ROTATE, WATERMARK, PAGE_NUMBERS, ORGANIZE, UNLOCK, REPAIR, CROP, REDACT, METADATA',
        supportedTools: ['MERGE', 'SPLIT', 'COMPRESS', 'ROTATE', 'WATERMARK', 'PAGE_NUMBERS', 'ORGANIZE', 'UNLOCK', 'REPAIR', 'CROP', 'REDACT', 'METADATA'],
      }, { status: 400 })
    }

    // Log the job
    const elapsed = Date.now() - startedAt
    await pool.query(
      `INSERT INTO "PDFJob"
        (id, tool, "inputSize", "outputSize", status, "processingMs", options, "organizationId", "userId", "createdAt", "completedAt")
       VALUES ($1,$2,$3,$4,'COMPLETED',$5,$6,$7,$8,NOW(),NOW())`,
      [
        jobId, tool, inputBytes.length, outputBytes.length, elapsed,
        JSON.stringify({ ...body, fileData: '[stripped]', additionalFiles: body.additionalFiles ? '[' + body.additionalFiles.length + ' files]' : undefined }),
        orgId, session.userId,
      ]
    ).catch(() => {})

    return NextResponse.json({
      success: true,
      jobId,
      tool,
      outputData: bytesToDataUrl(outputBytes, outputMime),
      outputSize: outputBytes.length,
      processingMs: elapsed,
      ...extra,
    })
  } catch (error) {
    // Log failure
    const elapsed = Date.now() - startedAt
    try {
      const session = await requireTenant(request)
      const orgId = session?.organizationId || 'unknown'
      await pool.query(
        `INSERT INTO "PDFJob" (id, tool, status, "errorMessage", "processingMs", "organizationId", "createdAt")
         VALUES ($1,$2,'FAILED',$3,$4,$5,NOW())`,
        [jobId, 'UNKNOWN', (error as Error).message, elapsed, orgId]
      ).catch(() => {})
    } catch {}

    console.error('PDF Tool error:', error)
    return NextResponse.json({ error: 'PDF processing failed: ' + (error as Error).message }, { status: 500 })
  }
}

// Helper: hex color → {r,g,b} in 0-1 range
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16)
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255,
  }
}

function validPages(order: number[]): number[] {
  return order.filter(n => Number.isInteger(n) && n >= 0)
}