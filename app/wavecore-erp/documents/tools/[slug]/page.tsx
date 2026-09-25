'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, Loader2, CheckCircle2, X, Download, FileText,
  Layers, Scissors, Minimize2, RotateCw, Stamp, Hash, GitBranch,
  Lock, Unlock, RefreshCw, Crop, FileSearch, AlertTriangle, Sparkles,
} from 'lucide-react'

// Tool config per slug
const TOOL_CONFIG: Record<string, {
  title: string
  description: string
  apiTool: string
  icon: any
  color: string
  accept: string
  multiple?: boolean
  options?: { key: string; label: string; type: 'text'|'number'|'select'|'password'|'color'; default?: any; choices?: string[]; min?: number; max?: number; step?: number }[]
  multipleFiles?: boolean
}> = {
  merge: {
    title: 'Merge PDF',
    description: 'Combine multiple PDFs in the order you want',
    apiTool: 'MERGE',
    icon: Layers,
    color: 'from-blue-500 to-indigo-600',
    accept: '.pdf',
    multipleFiles: true,
  },
  split: {
    title: 'Split PDF',
    description: 'Extract pages from a PDF',
    apiTool: 'SPLIT',
    icon: Scissors,
    color: 'from-purple-500 to-fuchsia-600',
    accept: '.pdf',
    options: [
      { key: 'pages', label: 'Pages to extract (e.g. 1,3,5 or leave blank for first)', type: 'text', default: '' },
    ],
  },
  compress: {
    title: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    apiTool: 'COMPRESS',
    icon: Minimize2,
    color: 'from-green-500 to-emerald-600',
    accept: '.pdf',
  },
  rotate: {
    title: 'Rotate PDF',
    description: 'Rotate pages 90°, 180° or 270°',
    apiTool: 'ROTATE',
    icon: RotateCw,
    color: 'from-amber-500 to-orange-600',
    accept: '.pdf',
    options: [
      { key: 'angle', label: 'Angle', type: 'select', default: '90', choices: ['90', '180', '270'] },
    ],
  },
  watermark: {
    title: 'Watermark PDF',
    description: 'Add text watermark',
    apiTool: 'WATERMARK',
    icon: Stamp,
    color: 'from-rose-500 to-pink-600',
    accept: '.pdf',
    options: [
      { key: 'text', label: 'Watermark text', type: 'text', default: 'CONFIDENTIAL' },
      { key: 'opacity', label: 'Opacity (0-1)', type: 'number', default: 0.25, min: 0.05, max: 1, step: 0.05 },
      { key: 'fontSize', label: 'Font size', type: 'number', default: 60, min: 10, max: 200 },
      { key: 'color', label: 'Color', type: 'color', default: '#ff0000' },
    ],
  },
  'page-numbers': {
    title: 'Add Page Numbers',
    description: 'Insert page numbers into the PDF',
    apiTool: 'PAGE_NUMBERS',
    icon: Hash,
    color: 'from-cyan-500 to-teal-600',
    accept: '.pdf',
    options: [
      { key: 'position', label: 'Position', type: 'select', default: 'BOTTOM_CENTER', choices: ['BOTTOM_CENTER', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'] },
      { key: 'startNumber', label: 'Start number', type: 'number', default: 1, min: 1 },
    ],
  },
  organize: {
    title: 'Organize PDF',
    description: 'Reorder or remove pages',
    apiTool: 'ORGANIZE',
    icon: GitBranch,
    color: 'from-violet-500 to-purple-600',
    accept: '.pdf',
    options: [
      { key: 'pageOrder', label: 'New page order (e.g. 3,1,2)', type: 'text', default: '' },
    ],
  },
  unlock: {
    title: 'Unlock PDF',
    description: 'Remove PDF password security',
    apiTool: 'UNLOCK',
    icon: Unlock,
    color: 'from-emerald-500 to-green-600',
    accept: '.pdf',
    options: [
      { key: 'password', label: 'Current password', type: 'password', default: '' },
    ],
  },
  repair: {
    title: 'Repair PDF',
    description: 'Recover data from damaged PDFs',
    apiTool: 'REPAIR',
    icon: RefreshCw,
    color: 'from-slate-500 to-neutral-700',
    accept: '.pdf',
  },
  crop: {
    title: 'Crop PDF',
    description: 'Trim margins from every page',
    apiTool: 'CROP',
    icon: Crop,
    color: 'from-teal-500 to-cyan-600',
    accept: '.pdf',
    options: [
      { key: 'top', label: 'Top margin (pt)', type: 'number', default: 20, min: 0 },
      { key: 'bottom', label: 'Bottom margin (pt)', type: 'number', default: 20, min: 0 },
      { key: 'left', label: 'Left margin (pt)', type: 'number', default: 20, min: 0 },
      { key: 'right', label: 'Right margin (pt)', type: 'number', default: 20, min: 0 },
    ],
  },
  redact: {
    title: 'Redact PDF',
    description: 'Permanently remove sensitive content (visual redaction)',
    apiTool: 'REDACT',
    icon: FileSearch,
    color: 'from-red-500 to-rose-600',
    accept: '.pdf',
    options: [
      { key: 'areas', label: 'Areas JSON [{page,x,y,width,height}]', type: 'text', default: '' },
    ],
  },
  metadata: {
    title: 'Edit PDF Metadata',
    description: 'Update title, author, subject, keywords',
    apiTool: 'METADATA',
    icon: FileText,
    color: 'from-indigo-500 to-blue-600',
    accept: '.pdf',
    options: [
      { key: 'title', label: 'Title', type: 'text', default: '' },
      { key: 'author', label: 'Author', type: 'text', default: '' },
      { key: 'subject', label: 'Subject', type: 'text', default: '' },
      { key: 'keywords', label: 'Keywords (comma-separated)', type: 'text', default: '' },
    ],
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

export default function ToolPage() {
  const params = useParams()
  const router = useRouter()
  const slug = String(params.slug || '')

  const config = TOOL_CONFIG[slug]

  const [files, setFiles] = useState<File[]>([])
  const [options, setOptions] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (config?.options) {
      const defaults: Record<string, any> = {}
      for (const opt of config.options) defaults[opt.key] = opt.default ?? ''
      setOptions(defaults)
    }
    if (!config) {
      setError('Unknown tool: ' + slug)
    }
  }, [slug, config])

  if (!config) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p className="text-red-300">Unknown tool: {slug}</p>
          <Link href="/wavecore-erp/documents" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  const Icon = config.icon
  const isMultiple = config.multipleFiles || config.multiple
  const maxFiles = slug === 'merge' ? 20 : 1

  const pickFiles = () => {
    setError('')
    fileInputRef.current?.click()
  }

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files
    if (!f || f.length === 0) return
    const arr = Array.from(f).slice(0, maxFiles)
    setFiles(arr)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const removeAllFiles = () => {
    setFiles([])
    setResult(null)
    setError('')
  }

  const process = async () => {
    setError('')
    if (files.length === 0) { setError('Please select at least one file'); return }

    setLoading(true)
    setResult(null)

    try {
      const primaryData = await fileToDataUrl(files[0])
      const additionalFiles: string[] = []
      for (let i = 1; i < files.length; i++) {
        additionalFiles.push(await fileToDataUrl(files[i]))
      }

      // Build payload from options
      const payload: any = {
        tool: config.apiTool,
        fileData: primaryData,
      }
      if (additionalFiles.length > 0) payload.additionalFiles = additionalFiles

      for (const [k, v] of Object.entries(options)) {
        if (k === 'pageOrder' || k === 'areas') {
          // JSON or comma-separated → array
          if (!v) continue
          try {
            if (k === 'areas') {
              payload[k] = JSON.parse(String(v))
            } else {
              payload[k] = String(v).split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
            }
          } catch {
            setError('Invalid ' + k + ' format')
            setLoading(false)
            return
          }
        } else if (k === 'keywords') {
          payload[k] = String(v).split(',').map(s => s.trim()).filter(Boolean)
        } else if (k === 'opacity' || k === 'fontSize' || k === 'startNumber' || k === 'top' || k === 'bottom' || k === 'left' || k === 'right') {
          payload[k] = Number(v)
        } else {
          payload[k] = v
        }
      }

      const csrf = document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/wavecore/documents/pdf-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Processing failed'); return }

      setResult(data)
    } catch (err) {
      setError('Error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const downloadResult = () => {
    if (!result?.outputData) return
    const a = document.createElement('a')
    a.href = result.outputData
    a.download = slug + '-output.pdf'
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

        {/* Hero */}
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

        {/* Upload area */}
        {files.length === 0 && !result && (
          <div
            onClick={pickFiles}
            onDrop={(e) => { e.preventDefault(); onFilesSelected({ target: { files: e.dataTransfer.files } } as any) }}
            onDragOver={e => e.preventDefault()}
            className="cursor-pointer rounded-3xl border-2 border-dashed border-neutral-700 hover:border-indigo-500 bg-neutral-900/50 hover:bg-neutral-900 p-12 text-center transition-all"
          >
            <input ref={fileInputRef} type="file" accept={config.accept} multiple={isMultiple} onChange={onFilesSelected} className="hidden" />
            <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
            <p className="text-white font-bold mb-1">Choose {isMultiple ? 'files' : 'a file'}</p>
            <p className="text-sm text-neutral-500 mb-4">or drag and drop here</p>
            <span className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">
              Select {isMultiple ? 'files' : 'file'}
            </span>
            {isMultiple && <p className="text-xs text-neutral-500 mt-3">Up to {maxFiles} files · {config.accept}</p>}
          </div>
        )}

        {/* Selected files */}
        {files.length > 0 && !result && (
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-white font-bold">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              <button onClick={removeAllFiles} className="text-xs text-neutral-400 hover:text-red-400">Clear all</button>
            </div>
            <div className="space-y-2 mb-6">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-800">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <span className="text-sm text-white truncate">{f.name}</span>
                    <span className="text-xs text-neutral-500 flex-shrink-0">{Math.round(f.size / 1024)} KB</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Options */}
            {config.options && config.options.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Options</p>
                {config.options.map(opt => (
                  <div key={opt.key}>
                    <label className="text-xs text-neutral-400 font-bold block mb-1">{opt.label}</label>
                    {opt.type === 'select' ? (
                      <select value={options[opt.key] || ''} onChange={e => setOptions({ ...options, [opt.key]: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
                        {(opt.choices || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : opt.type === 'color' ? (
                      <input type="color" value={options[opt.key] || '#000000'} onChange={e => setOptions({ ...options, [opt.key]: e.target.value })} className="w-16 h-10 rounded-xl cursor-pointer" />
                    ) : (
                      <input
                        type={opt.type === 'number' ? 'number' : opt.type === 'password' ? 'password' : 'text'}
                        value={options[opt.key] || ''}
                        onChange={e => setOptions({ ...options, [opt.key]: e.target.value })}
                        min={opt.min} max={opt.max} step={opt.step}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
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
              {loading ? 'Processing…' : config.title}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-3xl bg-neutral-900 border border-green-800 p-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h2 className="text-xl font-bold text-white mb-2">Done!</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Processed in {result.processingMs}ms · Output: {Math.round((result.outputSize || 0) / 1024)} KB
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={downloadResult} className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={removeAllFiles} className="px-6 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold">
                Process Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}