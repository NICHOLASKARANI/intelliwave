'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Layers, Download, Upload, X, Loader2, CheckCircle2, Eye,
  Printer, Trash2, Save, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

interface UploadedFile { id: string; name: string; size: number; arrayBuffer: ArrayBuffer }

export default function MergePage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [merging, setMerging] = useState(false)
  const [mergedUrl, setMergedUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setError('')
    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf') { setError('PDF files only'); return }
      const arrayBuffer = await file.arrayBuffer()
      setFiles(prev => [...prev, { id: Date.now().toString() + Math.random(), name: file.name, size: file.size, arrayBuffer }])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const handleMerge = async () => {
    if (files.length < 2) { setError('Upload at least 2 PDFs'); return }
    setMerging(true); setError('')
    try {
      const merged = await PDFDocument.create()
      for (const f of files) {
        const doc = await PDFDocument.load(f.arrayBuffer)
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      const mergedBytes = await merged.save()
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
      setMergedUrl(URL.createObjectURL(blob))
    } catch (e) { setError('Merge failed: ' + (e as Error).message) }
    finally { setMerging(false) }
  }

  const downloadMerged = () => {
    if (!mergedUrl) return
    const a = document.createElement('a')
    a.href = mergedUrl
    a.download = 'merged-' + Date.now() + '.pdf'
    a.click()
  }

  const saveToDocuments = async () => {
    if (!mergedUrl) return
    setSaving(true); setError('')
    try {
      const blob = await (await fetch(mergedUrl)).blob()
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.readAsDataURL(blob)
      })
      const name = 'Merged - ' + files.length + ' PDFs'
      const res = await fetch('/api/wavecore/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name, fileName: 'merged-' + Date.now() + '.pdf',
          fileData: base64, category: 'TOOL_OUTPUT',
          description: 'Merged from ' + files.length + ' source PDFs',
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Save failed'); return }
      flash('Saved to Documents')
    } catch (e) { setError('Save failed: ' + (e as Error).message) }
    finally { setSaving(false) }
  }

  const clearOutput = () => { setMergedUrl(''); setFiles([]) }
  const printInfo = () => window.print()
  const fmtBytes = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(2) + ' MB'

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-blue-500" /> Merge PDFs</h1>
          <button onClick={printInfo} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">Merge Result</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2 print:hidden"><Upload className="w-5 h-5" /> Upload PDFs</h3>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload}
            className="block w-full text-sm mb-4 print:hidden file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold" />

          {files.length > 0 && (
            <div className="space-y-2 mb-4 print:hidden">
              {files.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{f.name}</span><span className="text-xs text-neutral-500">{fmtBytes(f.size)}</span></div>
                  <button onClick={() => removeFile(f.id)} className="p-1 rounded hover:bg-red-100"><X className="w-4 h-4 text-red-600" /></button>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleMerge} disabled={files.length < 2 || merging}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 mb-4 print:hidden">
            {merging ? <><Loader2 className="w-4 h-4 animate-spin" /> Merging...</> : <><Layers className="w-4 h-4" /> Merge {files.length} PDFs</>}
          </button>

          {mergedUrl && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200">
              <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="font-bold">Merged successfully</span></div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <button onClick={downloadMerged} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                  <Download className="w-3 h-3" /> Download
                </button>
                <button onClick={saveToDocuments} disabled={saving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {saving ? 'Saving...' : 'Save to Documents'}
                </button>
                <a href={mergedUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold flex items-center gap-1">
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