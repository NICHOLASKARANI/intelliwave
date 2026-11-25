'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Scissors, Download, Upload, X, Loader2, CheckCircle2, Eye,
  Printer, Trash2, Save, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

interface SplitResult { name: string; downloadUrl: string; pages: number }

export default function SplitPage() {
  const [fileName, setFileName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [splitting, setSplitting] = useState(false)
  const [splitResults, setSplitResults] = useState<SplitResult[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (file.type !== 'application/pdf') { setError('PDF only'); return }
    const arrayBuffer = await file.arrayBuffer()
    setFileName(file.name); setFileBuffer(arrayBuffer)
    const doc = await PDFDocument.load(arrayBuffer)
    setTotalPages(doc.getPageCount())
    setSplitResults([])
  }

  const handleSplit = async () => {
    if (!fileBuffer) { setError('Upload a PDF first'); return }
    setSplitting(true); setError(''); setSplitResults([])
    try {
      const srcDoc = await PDFDocument.load(fileBuffer)
      const results: SplitResult[] = []
      for (let i = 0; i < srcDoc.getPageCount(); i++) {
        const newDoc = await PDFDocument.create()
        const [page] = await newDoc.copyPages(srcDoc, [i])
        newDoc.addPage(page)
        const bytes = await newDoc.save()
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
        results.push({ name: 'page-' + (i + 1) + '.pdf', downloadUrl: URL.createObjectURL(blob), pages: i + 1 })
      }
      setSplitResults(results)
    } catch (e) { setError('Split failed: ' + (e as Error).message) }
    finally { setSplitting(false) }
  }

  const saveToDocuments = async (result: SplitResult) => {
    setSaving(result.name); setError('')
    try {
      const blob = await (await fetch(result.downloadUrl)).blob()
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.readAsDataURL(blob)
      })
      const baseName = (fileName || 'document.pdf').replace(/\.pdf$/i, '')
      const res = await fetch('/api/wavecore/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name: baseName + ' - ' + result.name,
          fileName: result.name,
          fileData: base64,
          category: 'TOOL_OUTPUT',
          description: 'Split from ' + fileName + ' (page ' + result.pages + ')',
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Save failed'); return }
      flash('Saved: ' + result.name)
    } catch (e) { setError('Save failed: ' + (e as Error).message) }
    finally { setSaving(null) }
  }

  const clearAll = () => { setSplitResults([]); setFileName(''); setFileBuffer(null); setTotalPages(0) }
  const printInfo = () => window.print()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Scissors className="w-5 h-5 text-purple-500" /> Split PDF</h1>
          <button onClick={printInfo} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">Split Result {fileName ? '- ' + fileName : ''}</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2 print:hidden"><Upload className="w-5 h-5" /> Upload PDF</h3>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload}
            className="block w-full text-sm mb-4 print:hidden file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:font-bold" />

          {fileName && (
            <div className="mb-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm flex justify-between">
              <span className="font-medium">{fileName}</span>
              <span className="text-neutral-500">{totalPages} pages</span>
            </div>
          )}

          <button onClick={handleSplit} disabled={!fileBuffer || splitting}
            className="w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 mb-4 print:hidden">
            {splitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Splitting...</> : <><Scissors className="w-4 h-4" /> Split into {totalPages} pages</>}
          </button>

          {splitResults.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <span className="font-bold">{splitResults.length} pages extracted</span>
                <button onClick={clearAll} className="ml-auto px-2 py-1 rounded bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1 print:hidden">
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>
              <div className="space-y-2">
                {splitResults.map(r => (
                  <div key={r.name} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-800">
                    <span className="text-sm font-medium">{r.name}</span>
                    <div className="flex gap-1 print:hidden">
                      <a href={r.downloadUrl} download={r.name} className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                        <Download className="w-3 h-3" />
                      </a>
                      <a href={r.downloadUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-700 text-xs font-bold">
                        <Eye className="w-3 h-3" />
                      </a>
                      <button onClick={() => saveToDocuments(r)} disabled={saving === r.name} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                        {saving === r.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}