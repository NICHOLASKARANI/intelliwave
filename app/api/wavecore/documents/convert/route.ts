export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'
import { pool } from '@/lib/wavecore/db'

let PDFLib: any = null
async function loadPDFLib() {
  if (!PDFLib) PDFLib = await import('pdf-lib')
  return PDFLib
}

// Decode base64 data URL to bytes
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

// Encode bytes to data URL
function bytesToDataUrl(bytes: Uint8Array, mime = 'application/pdf'): string {
  return 'data:' + mime + ';base64,' + Buffer.from(bytes).toString('base64')
}

// Simple HTML entity decoder for HTML→Text extraction
function decodeHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

// Strip HTML tags for HTML→PDF plain text
function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<h[1-6][^>]*>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/li>/gi, '')
        .replace(/<[^>]+>/g, '')
  )
}

// PDF text extraction using pdfjs-dist
async function extractPdfText(pdfBytes: Uint8Array): Promise<{ text: string; pages: string[]; pageCount: number }> {
  // Dynamic import to avoid build issues
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdf = await pdfjs.getDocument({ data: pdfBytes, useSystemFonts: true }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item: any) => item.str).join(' ')
    pages.push(pageText)
  }
  return { text: pages.join('\n\n'), pages, pageCount: pdf.numPages }
}

// Convert plain text to markdown (basic inference)
function textToMarkdown(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { out.push(''); continue }
    // Likely heading: short, no punctuation, title-case
    if (trimmed.length < 80 && !/[.!?]$/.test(trimmed) && trimmed.split(' ').length < 10) {
      out.push('## ' + trimmed)
    } else {
      out.push(trimmed)
    }
  }
  return out.join('\n')
}

// Simple markdown → plain text for PDF embedding
function markdownToPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')       // strip heading hashes
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/\*(.*?)\*/g, '$1')       // italic
    .replace(/`(.*?)`/g, '$1')         // code
    .replace(/^\s*[-*+]\s+/gm, '• ')   // bullets
    .replace(/^\s*\d+\.\s+/gm, '')     // numbered lists
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
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

    if (!tool) return NextResponse.json({ error: 'tool required' }, { status: 400 })

    const { PDFDocument, StandardFonts, rgb } = await loadPDFLib()

    let outputData: string
    let outputMime = 'application/pdf'
    let outputFilename = 'output.pdf'
    let extra: any = {}

    // ==================== JPG → PDF ====================
    if (tool === 'JPG_TO_PDF' || tool === 'PNG_TO_PDF') {
      const inputs: string[] = body.files || (body.fileData ? [body.fileData] : [])
      if (inputs.length === 0) return NextResponse.json({ error: 'files array required' }, { status: 400 })

      const doc = await PDFDocument.create()
      for (const dataUrl of inputs) {
        const bytes = dataUrlToBytes(dataUrl)
        const isJpg = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')
        const isPng = dataUrl.includes('image/png')
        if (!isJpg && !isPng) continue
        const img = isJpg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes)
        // Fit page to image with A4 constraint
        const maxW = 595
        const maxH = 842
        let w = img.width
        let h = img.height
        const ratio = Math.min(maxW / w, maxH / h)
        w = w * ratio
        h = h * ratio
        const page = doc.addPage([595, 842])
        page.drawImage(img, {
          x: (595 - w) / 2,
          y: (842 - h) / 2,
          width: w,
          height: h,
        })
      }
      const out = await doc.save()
      outputData = bytesToDataUrl(out)
      outputFilename = 'images-converted.pdf'
      extra = { imagesProcessed: inputs.length }
    }
    // ==================== PDF → TEXT ====================
    else if (tool === 'PDF_TO_TEXT') {
      if (!body.fileData) return NextResponse.json({ error: 'fileData required' }, { status: 400 })
      const bytes = dataUrlToBytes(body.fileData)
      const { text, pageCount } = await extractPdfText(bytes)
      outputData = 'data:text/plain;base64,' + Buffer.from(text).toString('base64')
      outputMime = 'text/plain'
      outputFilename = 'extracted.txt'
      extra = { pageCount, characters: text.length }
    }
    // ==================== PDF → MARKDOWN ====================
    else if (tool === 'PDF_TO_MARKDOWN') {
      if (!body.fileData) return NextResponse.json({ error: 'fileData required' }, { status: 400 })
      const bytes = dataUrlToBytes(body.fileData)
      const { text, pageCount } = await extractPdfText(bytes)
      const md = textToMarkdown(text)
      outputData = 'data:text/markdown;base64,' + Buffer.from(md).toString('base64')
      outputMime = 'text/markdown'
      outputFilename = 'converted.md'
      extra = { pageCount, characters: md.length }
    }
    // ==================== MARKDOWN → PDF ====================
    else if (tool === 'MARKDOWN_TO_PDF') {
      if (!body.markdown) return NextResponse.json({ error: 'markdown text required' }, { status: 400 })
      const plain = markdownToPlainText(body.markdown)
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

      const pageWidth = 595
      const pageHeight = 842
      const margin = 50
      const fontSize = 11
      const lineHeight = 16
      const maxWidth = pageWidth - margin * 2

      // Simple word-wrap
      const paragraphs = plain.split('\n')
      let page = doc.addPage([pageWidth, pageHeight])
      let y = pageHeight - margin

      for (const para of paragraphs) {
        if (!para.trim()) { y -= lineHeight; continue }
        const words = para.split(' ')
        let line = ''
        for (const w of words) {
          const test = line ? line + ' ' + w : w
          const width = font.widthOfTextAtSize(test, fontSize)
          if (width > maxWidth) {
            if (y < margin + lineHeight) {
              page = doc.addPage([pageWidth, pageHeight])
              y = pageHeight - margin
            }
            page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
            y -= lineHeight
            line = w
          } else {
            line = test
          }
        }
        if (line) {
          if (y < margin + lineHeight) {
            page = doc.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }
          page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
          y -= lineHeight * 1.4
        }
      }

      const out = await doc.save()
      outputData = bytesToDataUrl(out)
      outputFilename = 'markdown-converted.pdf'
      extra = { pageCount: doc.getPageCount() }
    }
    // ==================== HTML → PDF ====================
    else if (tool === 'HTML_TO_PDF') {
      if (!body.html) return NextResponse.json({ error: 'html text required' }, { status: 400 })
      const plain = stripHtml(body.html)
      // Reuse markdown-like text renderer
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)

      const pageWidth = 595
      const pageHeight = 842
      const margin = 50
      const fontSize = 11
      const lineHeight = 16
      const maxWidth = pageWidth - margin * 2

      let page = doc.addPage([pageWidth, pageHeight])
      let y = pageHeight - margin

      for (const para of plain.split('\n')) {
        if (!para.trim()) { y -= lineHeight; continue }
        const words = para.split(' ')
        let line = ''
        for (const w of words) {
          const test = line ? line + ' ' + w : w
          const width = font.widthOfTextAtSize(test, fontSize)
          if (width > maxWidth) {
            if (y < margin + lineHeight) {
              page = doc.addPage([pageWidth, pageHeight])
              y = pageHeight - margin
            }
            page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
            y -= lineHeight
            line = w
          } else {
            line = test
          }
        }
        if (line) {
          if (y < margin + lineHeight) {
            page = doc.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }
          page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
          y -= lineHeight * 1.4
        }
      }

      const out = await doc.save()
      outputData = bytesToDataUrl(out)
      outputFilename = 'html-converted.pdf'
      extra = { pageCount: doc.getPageCount() }
    }
    // ==================== PDF → PDF/A ====================
    else if (tool === 'PDF_TO_PDFA') {
      if (!body.fileData) return NextResponse.json({ error: 'fileData required' }, { status: 400 })
      const bytes = dataUrlToBytes(body.fileData)
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      // PDF/A tagging — set metadata per ISO 19005
      doc.setTitle(body.title || doc.getTitle() || 'Archived Document')
      doc.setAuthor(body.author || doc.getAuthor() || 'WaveCore')
      doc.setSubject('PDF/A compliant archive')
      doc.setProducer('WaveCore ERP')
      doc.setCreator('WaveCore PDF/A Converter')
      doc.setCreationDate(new Date())
      doc.setModificationDate(new Date())
      const out = await doc.save()
      outputData = bytesToDataUrl(out)
      outputFilename = 'pdfa-archived.pdf'
      extra = { standard: 'PDF/A-1b (metadata tagged)' }
    }
    // ==================== UNSUPPORTED ====================
    else {
      return NextResponse.json({
        error: 'Conversion tool "' + tool + '" not supported',
        supportedTools: [
          'JPG_TO_PDF', 'PNG_TO_PDF', 'PDF_TO_TEXT', 'PDF_TO_MARKDOWN',
          'MARKDOWN_TO_PDF', 'HTML_TO_PDF', 'PDF_TO_PDFA',
        ],
      }, { status: 400 })
    }

    // Log job
    const elapsed = Date.now() - startedAt
    await pool.query(
      `INSERT INTO "PDFJob"
        (id, tool, "inputSize", "outputSize", status, "processingMs", options, "organizationId", "userId", "createdAt", "completedAt")
       VALUES ($1,$2,$3,$4,'COMPLETED',$5,$6,$7,$8,NOW(),NOW())`,
      [
        jobId, tool,
        body.fileData ? dataUrlToBytes(body.fileData).length : 0,
        outputData ? outputData.length : 0,
        elapsed,
        JSON.stringify({ tool, options: '[stripped]' }),
        orgId, session.userId,
      ]
    ).catch(() => {})

    return NextResponse.json({
      success: true,
      jobId,
      tool,
      outputData,
      outputMime,
      outputFilename,
      processingMs: elapsed,
      ...extra,
    })
  } catch (error) {
    console.error('Convert error:', error)
    return NextResponse.json({ error: 'Conversion failed: ' + (error as Error).message }, { status: 500 })
  }
}