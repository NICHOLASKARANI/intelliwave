'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Scan, Loader2, Upload, FileText, Download, Trash2, Printer,
  AlertCircle, CheckCircle2, Sparkles, Languages, Clock,
} from 'lucide-react'

interface DocOption {
  id: string
  name: string
}

interface OCRResult {
  text: string
  confidence: number
  characters: number
  processingMs: number
  jobId: string
}

export default function OCRPage() {
  const [documents, setDocuments] = useState<DocOption[]>([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [language, setLanguage] = useState('eng')
  const [fileName, setFileName] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  useEffect(() => {
    fetch('/api/wavecore/documents?limit=500', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setDocuments((d.documents || []).map((x: any) => ({ id: x.id, name: x.name }))))
      .catch(() => {})
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setResult(null); setFileName(file.name)
    if (!file.type.startsWith('image/')) { setError('Upload an image file (PNG, JPG, WEBP)'); return }
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImagePreview(dataUrl)
      setImageBase64(dataUrl)
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsDataURL(file)
  }

  const runOCR = async () => {
    if (!imageBase64) { setError('Upload an image first'); return }
    setScanning(true); setError(''); setSuccess(''); setResult(null)
    try {
      const res = await fetch('/api/wavecore/documents/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          imageData: imageBase64,
          language,
          documentId: selectedDocId || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'OCR failed'); return }
      setResult({
        text: json.text || '',
        confidence: json.confidence || 0,
        characters: json.characters || 0,
        processingMs: json.processingMs || 0,
        jobId: json.jobId || '',
      })
      flash('OCR completed in ' + (json.processingMs || 0) + 'ms')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setScanning(false)
    }
  }

  const downloadText = () => {
    if (!result) return
    const blob = new Blob([result.text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (fileName.replace(/\.[^.]+$/, '') || 'ocr') + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setFileName(''); setImagePreview(''); setImageBase64(''); setResult(null); setError(''); setSuccess('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const printResult = () => window.print()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Scan className="w-5 h-5 text-blue-500" /> OCR Scanner</h1>
          <button onClick={printResult} disabled={!result} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">OCR Result {fileName ? '- ' + fileName : ''}</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="grid md:grid-cols-2 gap-4 print:hidden">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Image</h3>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload}
              className="block w-full text-sm mb-3 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold" />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg border max-h-64 object-contain" />
            )}
            <div className="mt-3">
              <label className="block text-xs font-bold text-neutral-500 mb-1">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm">
                <option value="eng">English</option>
                <option value="swa">Swahili</option>
                <option value="fra">French</option>
                <option value="ara">Arabic</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-bold text-neutral-500 mb-1">Attach to Document (optional)</label>
              <select value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm">
                <option value="">— don't attach —</option>
                {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={runOCR} disabled={!imageBase64 || scanning}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
                {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</> : <><Sparkles className="w-4 h-4" /> Run OCR</>}
              </button>
              <button onClick={clearAll} disabled={scanning}
                className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Extracted Text</h3>
            {result ? (
              <>
                <div className="text-xs text-neutral-500 mb-2 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {result.processingMs}ms</span>
                  <span>{result.characters} chars</span>
                  <span>Confidence: {result.confidence.toFixed(1)}%</span>
                </div>
                <textarea readOnly value={result.text}
                  className="w-full h-64 px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-xs font-mono" />
                <button onClick={downloadText} className="mt-2 w-full px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download as .txt
                </button>
              </>
            ) : (
              <div className="text-sm text-neutral-400 text-center py-12">
                Upload an image and click "Run OCR" to extract text
              </div>
            )}
          </div>
        </div>

        {/* Print-only result */}
        <div className="hidden print:block">
          {result && (
            <pre className="whitespace-pre-wrap text-sm border p-4 rounded">{result.text}</pre>
          )}
        </div>
      </main>
    </div>
  )
}