'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Upload, ArrowLeft, Loader2, CheckCircle2, X, FileText, AlertTriangle,
  Sparkles, FolderOpen, Tag,
} from 'lucide-react'

const CATEGORIES = ['GENERAL','INVOICE','CONTRACT','LEGAL','FINANCE','HR','REPORT','PROPOSAL','RECEIPT','MANUAL','POLICY','COMPLIANCE','OTHER']

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'GENERAL',
    tags: '',
    folderId: '',
  })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  useEffect(() => {
    fetch('/api/wavecore/documents/folders?mode=flat')
      .then(r => r.json())
      .then(d => setFolders(d.folders || []))
      .catch(() => {})
  }, [])

  const pickFiles = () => fileInputRef.current?.click()

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files
    if (!f || f.length === 0) return
    const arr = Array.from(f)
    setFiles(arr)
    if (arr.length > 0 && !form.name) {
      setForm(prev => ({ ...prev, name: arr[0].name.replace(/\.[^.]+$/, '') }))
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  const upload = async () => {
    setError('')
    setSuccess('')
    if (files.length === 0) { setError('Please select at least one file'); return }
    if (!form.name.trim()) { setError('Document name required'); return }

    setUploading(true)
    setProgress(0)

    try {
      let uploaded = 0
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const dataUrl = await fileToDataUrl(file)
        const name = files.length === 1 ? form.name.trim() : form.name.trim() + ' (' + (i+1) + ')'

        const res = await fetch('/api/wavecore/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
          body: JSON.stringify({
            name,
            fileName: file.name,
            fileUrl: dataUrl,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            category: form.category,
            tags: form.tags,
            description: form.description,
            folderId: form.folderId || null,
          }),
        })
        if (res.ok) uploaded++
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      if (uploaded > 0) {
        setSuccess(uploaded + ' document(s) uploaded successfully!')
        setTimeout(() => router.push('/wavecore-erp/documents'), 1500)
      } else {
        setError('Upload failed')
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Upload Document</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 p-6 lg:p-8 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Upload className="w-8 h-8" /> Upload Documents
          </h1>
          <p className="text-white/80 text-sm">Add files to your organization's document library</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {files.length === 0 && (
          <div
            onClick={pickFiles}
            onDrop={(e) => { e.preventDefault(); onFilesSelected({ target: { files: e.dataTransfer.files } } as any) }}
            onDragOver={e => e.preventDefault()}
            className="cursor-pointer rounded-3xl border-2 border-dashed border-neutral-700 hover:border-indigo-500 bg-neutral-900/50 hover:bg-neutral-900 p-12 text-center transition-all mb-6"
          >
            <input ref={fileInputRef} type="file" multiple onChange={onFilesSelected} className="hidden" />
            <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
            <p className="text-white font-bold mb-1">Choose files</p>
            <p className="text-sm text-neutral-500 mb-4">or drag and drop here</p>
            <span className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">
              Select Files
            </span>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-white font-bold">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                <button onClick={() => setFiles([])} className="text-xs text-neutral-400 hover:text-red-400">Clear all</button>
              </div>
              <div className="space-y-2">
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
            </div>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Document Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Folder</label>
                  <select value={form.folderId} onChange={e => setForm({ ...form, folderId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                    <option value="">Root (no folder)</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="invoice,2026,q4" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>

            {uploading && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-white font-bold">Uploading…</span>
                  <span className="text-sm text-indigo-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: progress + '%' }}></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => router.back()} className="px-6 py-3 rounded-xl bg-neutral-800 text-white font-bold">Cancel</button>
              <button onClick={upload} disabled={uploading} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {uploading ? 'Uploading…' : 'Upload ' + files.length + ' document' + (files.length !== 1 ? 's' : '')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}