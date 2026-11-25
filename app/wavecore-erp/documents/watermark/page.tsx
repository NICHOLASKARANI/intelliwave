'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Stamp, Download, Upload, Loader2, CheckCircle2, Eye,
  Printer, Trash2, Save, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

interface WatermarkResult { name: string; downloadUrl: string }

export default function WatermarkPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<WatermarkResult | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (file.type !== 'application/pdf') { setError('PDF only'); return }
    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name); setFileBuffer(arrayBuffer); setResult(null)
  }

  const applyWatermark = async () => {
    if (!fileBuffer || !watermarkText) { setError('Upload PDF and enter text'); return }
    setApplying(true); setError('')
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer)
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const pages = pdfDoc.getPages()
      for (const page of pages) {
        const { width, height } = page.getSize()
        const textWidth = font.widthOfTextAtSize(watermarkText, 60)
        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2, y: height / 2,
          size: 60, font, color: rgb(0.85, 0.85, 0.85), opacity: 0.3, rotate: degrees(45),
        })
      }
      const bytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
      setResult({ name: 'watermarked-' + (fileName || 'document.pdf'), downloadUrl: URL.createObjectURL(blob) })
    } catch (e) { setError('Watermark failed: ' + (e as Error).message) }
    finally { setApplying(false) }
  }

  const saveToDocuments = async () => {
    if (!result) return
    setSaving(true); setError('')
    try {
      const blob = await (await fetch(result.downloadUrl)).blob()
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.readAsDataURL(blob)
      })
      const res = await fetch('/api/wavecore/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name: 'Watermarked - ' + (fileName || 'document.pdf'),
          fileName: result.name, fileData: base64, category: 'TOOL_OUTPUT',
          description: 'Watermarked with: ' + watermarkText,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Save failed'); return }
      flash('Saved to Documents')
    } catch (e) { setError('Save failed: ' + (e as Error).message) }
    finally { setSaving(false) }
  }

  const clearOutput = () => { setResult(null); setFileName(''); setFileBuffer(null) }
  const printInfo = () => window.print()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Stamp className="w-5 h-5 text-amber-500" /> Watermark PDF</h1>
          <button onClick={printInfo} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">Watermark {fileName ? '- ' + fileName : ''}</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2 print:hidden"><Upload className="w-5 h-5" /> Upload PDF</h3>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload}
            className="block w-full text-sm mb-4 print:hidden file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:font-bold" />

          {fileName && (
            <div className="mb-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm font-medium">{fileName}</div>
          )}

          <div className="mb-4 print:hidden">
            <label className="block text-xs font-bold text-neutral-500 mb-1">Watermark Text</label>
            <input value={watermarkText} onChange={e => setWatermarkText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm" />
          </div>

          <button onClick={applyWatermark} disabled={!fileBuffer || !watermarkText || applying}
            className="w-full px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 mb-4 print:hidden">
            {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</> : <><Stamp className="w-4 h-4" /> Apply Watermark</>}
          </button>

          {result && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                <span className="font-bold">Watermark applied</span>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <a href={result.downloadUrl} download={result.name} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                  <Download className="w-3 h-3" /> Download
                </a>
                <button onClick={saveToDocuments} disabled={saving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {saving ? 'Saving...' : 'Save to Documents'}
                </button>
                <a href={result.downloadUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview
                </a>
                <button onClick={clearOutput} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}