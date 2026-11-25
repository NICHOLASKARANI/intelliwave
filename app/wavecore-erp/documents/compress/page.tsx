'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Minimize2, Download, Upload, FileText, Loader2, CheckCircle2, Eye,
  Printer, Trash2, Save, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

export default function CompressPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressing, setCompressing] = useState(false)
  const [compressedUrl, setCompressedUrl] = useState('')
  const [compressedSize, setCompressedSize] = useState(0)
  const [compressionRatio, setCompressionRatio] = useState(0)
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
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file'); return }
    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name); setFileBuffer(arrayBuffer); setOriginalSize(file.size)
    setCompressedUrl(''); setCompressedSize(0); setCompressionRatio(0)
  }

  const handleCompress = async () => {
    if (!fileBuffer) { setError('Upload a PDF first'); return }
    setCompressing(true); setError('')
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { updateMetadata: false })
      const compressed = await pdfDoc.save({ useObjectStreams: true })
      const blob = new Blob([new Uint8Array(compressed)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setCompressedUrl(url); setCompressedSize(blob.size)
      setCompressionRatio(Math.round((1 - blob.size / originalSize) * 100))
    } catch (e) {
      setError('Compression failed: ' + (e as Error).message)
    } finally { setCompressing(false) }
  }

  const downloadCompressed = () => {
    if (!compressedUrl) return
    const a = document.createElement('a')
    a.href = compressedUrl
    a.download = 'compressed-' + (fileName || 'document.pdf')
    a.click()
  }

  const saveToDocuments = async () => {
    if (!compressedUrl) return
    setSaving(true); setError('')
    try {
      const blob = await (await fetch(compressedUrl)).blob()
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.readAsDataURL(blob)
      })
      const name = 'Compressed - ' + (fileName || 'document.pdf')
      const res = await fetch('/api/wavecore/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name,
          fileName: 'compressed-' + (fileName || 'document.pdf'),
          fileData: base64,
          category: 'TOOL_OUTPUT',
          description: 'Compressed PDF (' + compressionRatio + '% reduction)',
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Save failed'); return }
      flash('Saved to Documents')
    } catch (e) {
      setError('Save failed: ' + (e as Error).message)
    } finally { setSaving(false) }
  }

  const clearOutput = () => {
    setCompressedUrl(''); setCompressedSize(0); setCompressionRatio(0)
  }

  const printInfo = () => window.print()

  const fmtBytes = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(2) + ' MB'

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Minimize2 className="w-5 h-5 text-green-500" /> Compress PDF</h1>
          <button onClick={printInfo} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">PDF Compression {fileName ? '- ' + fileName : ''}</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2 print:hidden"><Upload className="w-5 h-5" /> Upload PDF</h3>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload}
            className="block w-full text-sm mb-4 print:hidden file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:font-bold" />

          {fileName && (
            <div className="mb-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm">
              <div className="flex justify-between"><span className="font-medium">{fileName}</span><span>{fmtBytes(originalSize)}</span></div>
            </div>
          )}

          <div className="flex gap-2 mb-4 print:hidden">
            <button onClick={handleCompress} disabled={!fileBuffer || compressing}
              className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
              {compressing ? <><Loader2 className="w-4 h-4 animate-spin" /> Compressing...</> : <><Minimize2 className="w-4 h-4" /> Compress</>}
            </button>
          </div>

          {compressedUrl && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-bold">Compression complete</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div><p className="text-xs text-neutral-500">Original</p><p className="font-bold">{fmtBytes(originalSize)}</p></div>
                <div><p className="text-xs text-neutral-500">Compressed</p><p className="font-bold">{fmtBytes(compressedSize)}</p></div>
                <div><p className="text-xs text-neutral-500">Saved</p><p className="font-bold text-green-600">{compressionRatio}%</p></div>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <button onClick={downloadCompressed} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                  <Download className="w-3 h-3" /> Download
                </button>
                <button onClick={saveToDocuments} disabled={saving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {saving ? 'Saving...' : 'Save to Documents'}
                </button>
                <a href={compressedUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold flex items-center gap-1">
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