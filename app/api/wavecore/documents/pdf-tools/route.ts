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
      try {
        const CantooPDF: any = await import('@cantoo/pdf-lib')
        const doc = await CantooPDF.PDFDocument.load(inputBytes, { ignoreEncryption: true })
        const ownerPassword = body.ownerPassword || password
        doc.encrypt({ userPassword: password, ownerPassword, algorithm: 'AES-256' })
        outputBytes = await doc.save()
        outputMime = 'application/pdf'
        extra = { encrypted: true, algorithm: 'AES-256' }
      } catch (e: any) {
        return NextResponse.json({ error: 'Could not protect PDF: ' + (e?.message || 'unknown error') }, { status: 500 })
      }
    }
    // ==================== UNLOCK (decrypt) ====================
    else if (tool === 'UNLOCK') {
      const password = String(body.password || '').trim()
      if (!password) return NextResponse.json({ error: 'password required for unlock' }, { status: 400 })
      try {
        const CantooPDF: any = await import('@cantoo/pdf-lib')
        // ignoreEncryption: false forces actual decryption with the password
        const doc = await CantooPDF.PDFDocument.load(inputBytes, { password, ignoreEncryption: false })
        outputBytes = await doc.save()
        outputMime = 'application/pdf'
        extra = { unlocked: true }
      } catch (e: any) {
        return NextResponse.json({ error: 'Could not unlock PDF. Wrong password or unsupported encryption: ' + (e?.message || '') }, { status: 400 })
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
    
    // ==================== JPG TO PDF ====================
    else if (tool === 'JPG_TO_PDF') {
      const { PDFDocument } = await loadPDFLib()
      const doc = await PDFDocument.create()
      const isJpg = inputBytes[0] === 0xFF && inputBytes[1] === 0xD8
      const isPng = inputBytes[0] === 0x89 && inputBytes[1] === 0x50
      let img
      if (isJpg) img = await doc.embedJpg(inputBytes)
      else if (isPng) img = await doc.embedPng(inputBytes)
      else { return NextResponse.json({ error: 'Only JPG and PNG images supported' }, { status: 400 }) }
      const page = doc.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      outputBytes = await doc.save()
    }

    // ==================== PDF TO TEXT ====================
    else if (tool === 'PDF_TO_TEXT') {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null) as any
      if (!pdfjsLib) {
        return NextResponse.json({ error: 'PDF text extraction library not available' }, { status: 500 })
      }
      const loadingTask = pdfjsLib.getDocument({ data: inputBytes, useSystemFonts: true })
      const pdf = await loadingTask.promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((it: any) => it.str).join(' ')
        fullText += 'Page ' + i + ':\n' + pageText + '\n\n'
      }
      outputBytes = new TextEncoder().encode(fullText)
      outputMime = 'text/plain'
      extra = { text: fullText, characters: fullText.length, pages: pdf.numPages }
    }

    // ==================== PDF TO MARKDOWN ====================
    else if (tool === 'PDF_TO_MD') {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null) as any
      if (!pdfjsLib) {
        return NextResponse.json({ error: 'PDF text extraction library not available' }, { status: 500 })
      }
      const loadingTask = pdfjsLib.getDocument({ data: inputBytes, useSystemFonts: true })
      const pdf = await loadingTask.promise
      let md = '# Extracted from PDF\n\n'
      for (let i = 1; i <= pdf.numPages; i++) {
        md += '## Page ' + i + '\n\n'
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((it: any) => it.str).join(' ')
        md += pageText + '\n\n'
      }
      outputBytes = new TextEncoder().encode(md)
      outputMime = 'text/markdown'
      extra = { text: md, characters: md.length, pages: pdf.numPages }
    }

    // ==================== MARKDOWN TO PDF ====================
    else if (tool === 'MD_TO_PDF') {
      const { PDFDocument, StandardFonts } = await loadPDFLib()
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
      const rawText = new TextDecoder().decode(inputBytes)
      const lines = rawText.split('\n')
      let page = doc.addPage([595, 842])
      let y = 800
      const margin = 50
      const maxWidth = 595 - margin * 2
      for (const line of lines) {
        if (y < 50) { page = doc.addPage([595, 842]); y = 800 }
        const isH1 = line.startsWith('# ')
        const isH2 = line.startsWith('## ')
        const isH3 = line.startsWith('### ')
        let text = line.replace(/^#{1,3}\s*/, '')
        const size = isH1 ? 20 : isH2 ? 16 : isH3 ? 14 : 11
        const fnt = isH1 || isH2 || isH3 ? fontBold : font
        if (text.length === 0) { y -= size + 4; continue }
        const words = text.split(' ')
        let lineBuf = ''
        for (const w of words) {
          const test = lineBuf + (lineBuf ? ' ' : '') + w
          if (fnt.widthOfTextAtSize(test, size) > maxWidth) {
            page.drawText(lineBuf, { x: margin, y, size, font: fnt })
            y -= size + 3
            if (y < 50) { page = doc.addPage([595, 842]); y = 800 }
            lineBuf = w
          } else {
            lineBuf = test
          }
        }
        if (lineBuf) { page.drawText(lineBuf, { x: margin, y, size, font: fnt }); y -= size + 4 }
      }
      outputBytes = await doc.save()
    }

    // ==================== HTML TO PDF ====================
    else if (tool === 'HTML_TO_PDF') {
      const { PDFDocument, StandardFonts } = await loadPDFLib()
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const rawHtml = new TextDecoder().decode(inputBytes)
      const text = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
      const page = doc.addPage([595, 842])
      const words = text.split(' ')
      let y = 800, lineBuf = ''
      const maxWidth = 495
      for (const w of words) {
        const test = lineBuf + (lineBuf ? ' ' : '') + w
        if (font.widthOfTextAtSize(test, 11) > maxWidth) {
          page.drawText(lineBuf, { x: 50, y, size: 11, font })
          y -= 14
          if (y < 50) break
          lineBuf = w
        } else { lineBuf = test }
      }
      if (lineBuf && y >= 50) page.drawText(lineBuf, { x: 50, y, size: 11, font })
      outputBytes = await doc.save()
    }

    // ==================== PDF TO PDF/A ====================
    else if (tool === 'PDF_TO_PDFA') {
      const { PDFDocument } = await loadPDFLib()
      const doc = await PDFDocument.load(inputBytes)
      doc.setTitle(doc.getTitle() || 'PDF/A Document')
      doc.setProducer('WaveCore ERP (PDF/A-2B)')
      doc.setCreator('WaveCore')
      doc.setCreationDate(new Date())
      doc.setModificationDate(new Date())
      outputBytes = await doc.save({ useObjectStreams: false })
      extra = { note: 'PDF/A-2B metadata applied. Full compliance requires additional validation.' }
    }

    // ==================== EDIT PDF ====================
    else if (tool === 'EDIT_PDF') {
      const { PDFDocument, rgb, StandardFonts } = await loadPDFLib()
      const doc = await PDFDocument.load(inputBytes)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const text = String(body.options?.text || body.text || 'Edit annotation')
      const pages = doc.getPages()
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      firstPage.drawText(text, { x: 50, y: height - 50, size: 14, font, color: rgb(1, 0, 0) })
      outputBytes = await doc.save()
    }

    // ==================== AI SUMMARIZE ====================
    else if (tool === 'AI_SUMMARIZE') {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null) as any
      if (!pdfjsLib) {
        return NextResponse.json({ error: 'PDF text extraction library not available' }, { status: 500 })
      }
      const loadingTask = pdfjsLib.getDocument({ data: inputBytes, useSystemFonts: true })
      const pdf = await loadingTask.promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((it: any) => it.str).join(' ') + ' '
      }
      const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20)
      const summary = sentences.slice(0, Math.min(5, sentences.length)).join('. ') + '.'
      const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length
      outputBytes = new TextEncoder().encode('SUMMARY:\n\n' + summary + '\n\n---\n\nWord count: ' + wordCount + '\nPages: ' + pdf.numPages)
      outputMime = 'text/plain'
      extra = { text: summary, wordCount, pages: pdf.numPages }
    }

    // ==================== AI STATISTICS ====================
    else if (tool === 'AI_STATS') {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null) as any
      if (!pdfjsLib) {
        return NextResponse.json({ error: 'PDF text extraction library not available' }, { status: 500 })
      }
      const loadingTask = pdfjsLib.getDocument({ data: inputBytes, useSystemFonts: true })
      const pdf = await loadingTask.promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((it: any) => it.str).join(' ') + ' '
      }
      const words = fullText.split(/\s+/).filter(w => w.length > 0)
      const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const uniqueWords = new Set(words.map(w => w.toLowerCase()))
      const readingTimeMin = Math.ceil(words.length / 200)
      const stats = {
        pages: pdf.numPages,
        words: words.length,
        sentences: sentences.length,
        uniqueWords: uniqueWords.size,
        avgWordLength: words.length > 0 ? (words.reduce((s, w) => s + w.length, 0) / words.length).toFixed(1) : 0,
        avgSentenceLength: sentences.length > 0 ? (words.length / sentences.length).toFixed(1) : 0,
        readingTimeMin,
        estimatedComplexity: sentences.length > 0 && (words.length / sentences.length) > 20 ? 'High' : 'Standard',
      }
      const reportText = 'AI Statistics Report\n====================\n\n' +
        'Pages: ' + stats.pages + '\n' +
        'Words: ' + stats.words + '\n' +
        'Sentences: ' + stats.sentences + '\n' +
        'Unique words: ' + stats.uniqueWords + '\n' +
        'Avg word length: ' + stats.avgWordLength + '\n' +
        'Avg sentence length: ' + stats.avgSentenceLength + '\n' +
        'Reading time: ~' + stats.readingTimeMin + ' min\n' +
        'Complexity: ' + stats.estimatedComplexity
      outputBytes = new TextEncoder().encode(reportText)
      outputMime = 'text/plain'
      extra = { text: reportText, stats }
    }

    // ==================== TRANSLATE PDF (extract text) ====================
    else if (tool === 'TRANSLATE') {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null) as any
      if (!pdfjsLib) {
        return NextResponse.json({ error: 'PDF text extraction library not available' }, { status: 500 })
      }
      const loadingTask = pdfjsLib.getDocument({ data: inputBytes, useSystemFonts: true })
      const pdf = await loadingTask.promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((it: any) => it.str).join(' ') + '\n\n'
      }
      outputBytes = new TextEncoder().encode('EXTRACTED TEXT (TRANSLATION REQUIRES EXTERNAL API):\n\n' + fullText)
      outputMime = 'text/plain'
      extra = {
        text: fullText,
        note: 'Translation requires Google Translate API or OpenAI API key. Extracted text is provided for manual translation.'
      }
    }
    else if (tool === 'PDF_TO_WORD') {
      const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(inputBytes) }).promise
      const docx: any = await import('docx')
      const children: any[] = []
      for (let pn = 1; pn <= pdf.numPages; pn++) {
        const pg = await pdf.getPage(pn)
        const tc = await pg.getTextContent()
        const txt = tc.items.map((x: any) => x.str).join(' ')
        children.push(new docx.Paragraph({ children: [new docx.TextRun(txt)] }))
      }
      const finalDoc = new docx.Document({ sections: [{ properties: {}, children }] })
      const buffer = await docx.Packer.toBuffer(finalDoc)
      outputBytes = new Uint8Array(buffer)
      outputMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      extra = { pages: pdf.numPages }
    }
    else if (tool === 'PDF_TO_EXCEL') {
      const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(inputBytes) }).promise
      const XLSX: any = await import('xlsx')
      const allRows: string[][] = []
      for (let pn = 1; pn <= pdf.numPages; pn++) {
        const pg = await pdf.getPage(pn)
        const tc = await pg.getTextContent()
        const lineMap: Record<number, { x: number; text: string }[]> = {}
        for (const item of tc.items) {
          const y = Math.round(item.transform[5])
          if (!lineMap[y]) lineMap[y] = []
          lineMap[y].push({ x: item.transform[4], text: item.str })
        }
        const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a)
        for (const y of sortedYs) {
          const cells = lineMap[y].sort((a, b) => a.x - b.x).map(c => c.text.trim()).filter(t => t.length > 0)
          if (cells.length > 0) allRows.push(cells)
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(allRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      outputBytes = new Uint8Array(buffer)
      outputMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      extra = { pages: pdf.numPages, rows: allRows.length }
    }
    else if (tool === 'EXCEL_TO_PDF') {
      const XLSX: any = await import('xlsx')
      const wb = XLSX.read(inputBytes, { type: 'buffer' })
      const firstSheet = wb.SheetNames[0]
      if (!firstSheet) return NextResponse.json({ error: 'No sheets in workbook' }, { status: 400 })
      const ws = wb.Sheets[firstSheet]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const fontSize = 9
      const lineHeight = 14
      const margin = 40
      const pageW = 595, pageH = 842
      const usableW = pageW - margin * 2
      let page = doc.addPage([pageW, pageH])
      let y = pageH - margin
      const drawLine = (text: string) => {
        if (y < margin + lineHeight) { page = doc.addPage([pageW, pageH]); y = pageH - margin }
        page.drawText(String(text).slice(0, 200), { x: margin, y, size: fontSize, font })
        y -= lineHeight
      }
      for (const row of rows) {
        if (y < margin + lineHeight) { page = doc.addPage([pageW, pageH]); y = pageH - margin }
        const cellText = row.map((v: any) => String(v ?? '')).join('  |  ')
        page.drawText(cellText.slice(0, 200), { x: margin, y, size: fontSize, font })
        y -= lineHeight
      }
      const buffer = await doc.save()
      outputBytes = new Uint8Array(buffer)
      outputMime = 'application/pdf'
      extra = { rows: rows.length, sheet: firstSheet }
    }
    else if (tool === 'WORD_TO_PDF') {
      const mammoth: any = await import('mammoth')
      const buffer = Buffer.from(inputBytes)
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value || ''
      const lines2 = text.split(/\r?\n/)
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const fontSize = 10
      const lineHeight = 14
      const margin = 40
      const pageW = 595, pageH = 842
      let page = doc.addPage([pageW, pageH])
      let y = pageH - margin
      for (const rawLine of lines2) {
        if (y < margin + lineHeight) { page = doc.addPage([pageW, pageH]); y = pageH - margin }
        const safeLine = String(rawLine).replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 200)
        page.drawText(safeLine, { x: margin, y, size: fontSize, font, maxWidth: pageW - margin * 2 })
        y -= lineHeight
      }
      const pdfBytes = await doc.save()
      outputBytes = new Uint8Array(pdfBytes)
      outputMime = 'application/pdf'
      extra = { lines: lines2.length }
    }
    else if (tool === 'SIGN') {
      const sigData = body.signatureData || body.signature
      if (!sigData) return NextResponse.json({ error: 'signatureData (PNG base64) required' }, { status: 400 })
      try {
        const sigBytes = dataUrlToBytes(sigData)
        const doc = await PDFDocument.load(inputBytes, { ignoreEncryption: true })
        const png = await doc.embedPng(sigBytes)
        const pages = doc.getPages()
        const pn = Math.max(1, Math.min(Number(body.pageNumber) || 1, pages.length))
        const w = Number(body.width) || 150
        const h = Number(body.height) || 60
        pages[pn - 1].drawImage(png, { x: Number(body.x) || 100, y: Number(body.y) || 100, width: w, height: h })
        outputBytes = await doc.save()
        outputMime = 'application/pdf'
        extra = { pageNumber: pn, width: w, height: h }
      } catch (e: any) {
        return NextResponse.json({ error: 'Could not sign PDF: ' + (e?.message || 'unknown error') }, { status: 500 })
      }
    }
else {
      return NextResponse.json({
        error: 'Tool "' + tool + '" not supported in this environment. Supported: MERGE, SPLIT, COMPRESS, ROTATE, WATERMARK, PAGE_NUMBERS, ORGANIZE, UNLOCK, REPAIR, CROP, REDACT, METADATA',
        supportedTools: ['MERGE', 'SPLIT', 'COMPRESS', 'ROTATE', 'WATERMARK', 'PAGE_NUMBERS', 'ORGANIZE', 'UNLOCK', 'REPAIR', 'CROP', 'REDACT', 'METADATA', 'PDF_TO_WORD', 'PDF_TO_EXCEL', 'EXCEL_TO_PDF', 'WORD_TO_PDF'],
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