'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, Loader2, CheckCircle2, X, Download, FileText,
  FileImage, FileType, Quote, FileBarChart, Archive, AlertTriangle,
  Sparkles, Languages,
} from 'lucide-react'

const CONVERT_CONFIG: Record<string, {
  title: string
  description: string
  apiTool: string
  icon: any
  color: string
  accept: string
  multiple?: boolean
  outputExt: string
  inputType: 'file' | 'text'
  textPlaceholder?: string
  textLabel?: string
}> = {
  'jpg-to-pdf': {
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF',
    apiTool: 'JPG_TO_PDF',
    icon: FileImage,
    color: 'from-pink-500 to-rose-600',
    accept: 'image/jpeg',
    multiple: true,
    outputExt: 'pdf',
    inputType: 'file',
  },
  'pdf-to-text': {
    title: 'PDF to Text',
    description: 'Extract text from PDF',
    apiTool: 'PDF_TO_TEXT',
    icon: FileType,
    color: 'from-cyan-500 to-blue-600',
    accept: '.pdf',
    outputExt: 'txt',
    inputType: 'file',
  },
  'pdf-to-md': {
    title: 'PDF to Markdown',
    description: 'Convert PDF to Markdown format',
    apiTool: 'PDF_TO_MARKDOWN',
    icon: Quote,
    color: 'from-teal-500 to-emerald-600',
    accept: '.pdf',
    outputExt: 'md',
    inputType: 'file',
  },
  'md-to-pdf': {
    title: 'Markdown to PDF',
    description: 'Convert Markdown text to PDF',
    apiTool: 'MARKDOWN_TO_PDF',
    icon: FileText,
    color: 'from-indigo-500 to-purple-600',
    accept: '',
    outputExt: 'pdf',
    inputType: 'text',
    textLabel: 'Paste Markdown content',
    textPlaceholder: '# Heading\n\nYour **Markdown** here...',
  },
  'html-to-pdf': {
    title: 'HTML to PDF',
    description: 'Convert HTML content to PDF',
    apiTool: 'HTML_TO_PDF',
    icon: FileBarChart,
    color: 'from-orange-500 to-red-600',
    accept: '',
    outputExt: 'pdf',
    inputType: 'text',
    textLabel: 'Paste HTML content',
    textPlaceholder: '<h1>Title</h1><p>Content...</p>',
  },
  'pdf-to-pdfa': {
    title: 'PDF to PDF/A',
    description: 'Convert to PDF/A archival standard',
    apiTool: 'PDF_TO_PDFA',
    icon: Archive,
    color: 'from-slate-500 to-neutral-700',
    accept: '.pdf',
    outputExt: 'pdf',
    inputType: 'file',
  },
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function ConvertPage() {
  const params = useParams()
  const router = useRouter()
  const slug = String(params.slug || '')

  const config = CONVERT_CONFIG[slug]

  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!config) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p className="text-red-300">Unknown conversion: {slug}</p>
          <Link href="/wavecore-erp/documents" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  const Icon = config.icon

  const pickFiles = () => fileInputRef.current?.click()

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files
    if (!f) return
    setFiles(Array.from(f).slice(0, config.multiple ? 20 : 1))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const process = async () => {
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const payload: any = { tool: config.apiTool }

      if (config.inputType === 'file') {
        if (files.length === 0) { setError('Please select a file'); setLoading(false); return }
        if (config.multiple) {
          const dataUrls: string[] = []
          for (const f of files) dataUrls.push(await fileToDataUrl(f))
          payload.files = dataUrls
        } else {
          payload.fileData = await fileToDataUrl(files[0])
        }
      } else {
        if (!text.trim()) { setError('Please enter content'); setLoading(false); return }
        if (config.apiTool === 'MARKDOWN_TO_PDF') payload.markdown = text
        if (config.apiTool === 'HTML_TO_PDF') payload.html = text
      }

      const csrf = document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/wavecore/documents/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Conversion failed'); return }
      setResult(data)
    } catch (err) {
      setError('Error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!result?.outputData) return
    const a = document.createElement('a')
    a.href = result.outputData
    a.download = slug + '-output.' + config.outputExt
    a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Documents · {config.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className={'rounded-3xl bg-gradient-to-br ' + config.color + ' p-6 lg:p-8 mb-6'}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{config.title}</h1>
              <p className="text-white/80 text-sm">{config.description}</p>
            </div>
          </div>
        </div>

        {config.inputType === 'file' && files.length === 0 && !result && (
          <div
            onClick={pickFiles}
            onDrop={(e) => { e.preventDefault(); onFilesSelected({ target: { files: e.dataTransfer.files } } as any) }}
            onDragOver={e => e.preventDefault()}
            className="cursor-pointer rounded-3xl border-2 border-dashed border-neutral-700 hover:border-indigo-500 bg-neutral-900/50 hover:bg-neutral-900 p-12 text-center transition-all"
          >
            <input ref={fileInputRef} type="file" accept={config.accept} multiple={config.multiple} onChange={onFilesSelected} className="hidden" />
            <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
            <p className="text-white font-bold mb-1">Choose {config.multiple ? 'files' : 'a file'}</p>
            <p className="text-sm text-neutral-500 mb-4">or drag and drop here</p>
            <span className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">
              Select {config.multiple ? 'files' : 'file'}
            </span>
          </div>
        )}

        {config.inputType === 'text' && !result && (
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6 mb-6">
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-2">{config.textLabel}</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={config.textPlaceholder}
              rows={12}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm font-mono"
            />
          </div>
        )}

        {(files.length > 0 || (config.inputType === 'text' && text.trim())) && !result && (
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6 mb-6">
            {files.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-white font-bold">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                  <button onClick={() => setFiles([])} className="text-xs text-neutral-400 hover:text-red-400">Clear</button>
                </div>
                <div className="space-y-2 mb-6">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-800">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span className="text-sm text-white truncate">{f.name}</span>
                        <span className="text-xs text-neutral-500">{Math.round(f.size / 1024)} KB</span>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={process}
              disabled={loading}
              className={'w-full py-3.5 rounded-xl bg-gradient-to-r ' + config.color + ' text-white font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2'}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Converting…' : 'Convert Now'}
            </button>
          </div>
        )}

        {result && (
          <div className="rounded-3xl bg-neutral-900 border border-green-800 p-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h2 className="text-xl font-bold text-white mb-2">Conversion complete</h2>
            <p className="text-sm text-neutral-400 mb-6">
              {result.processingMs}ms{result.pageCount ? ' · ' + result.pageCount + ' pages' : ''}{result.characters ? ' · ' + result.characters + ' chars' : ''}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={download} className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={() => { setResult(null); setFiles([]); setText('') }} className="px-6 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold">
                Convert Another
              </button>
            </div>
          </div>
        )}

        {/* Preview for text outputs */}
        {result && (config.outputExt === 'txt' || config.outputExt === 'md') && result.outputData && (
          <div className="mt-6 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-2">Preview</p>
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {(() => {
                try {
                  const b64 = result.outputData.split(',')[1]
                  return Buffer.from(b64, 'base64').toString('utf-8').slice(0, 2000)
                } catch { return '(preview unavailable)' }
              })()}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}