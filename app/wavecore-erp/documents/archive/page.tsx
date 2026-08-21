'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Archive, Download, Upload, FileText, Loader2, CheckCircle, Eye, Trash2, Search } from 'lucide-react'

interface ArchivedDoc {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  dataUrl: string
}

export default function ArchivePage() {
  const [documents, setDocuments] = useState<ArchivedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('archived-docs')
    if (saved) setDocuments(JSON.parse(saved))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('archived-docs', JSON.stringify(documents))
  }, [documents, loading])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setUploading(true)
    setSuccess('')

    Array.from(fileList).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const newDoc: ArchivedDoc = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toLocaleString(),
          dataUrl,
        }
        setDocuments(prev => [newDoc, ...prev])
        setSuccess('Document archived successfully!')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadDoc = (doc: ArchivedDoc) => {
    const a = document.createElement('a')
    a.href = doc.dataUrl
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const viewDoc = (doc: ArchivedDoc) => {
    window.open(doc.dataUrl, '_blank')
  }

  const deleteDoc = (id: string) => {
    if (!confirm('Delete this archived document?')) return
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleDownloadAllPDF = () => {
    const content = [
      'WaveCore ERP - Archive Report',
      '='.repeat(50),
      'Total Documents: ' + documents.length,
      'Generated: ' + new Date().toLocaleString(),
      '='.repeat(50),
      '',
      ...documents.map((d, i) => 
        `${i+1}. ${d.name} (${formatSize(d.size)}) - ${d.uploadedAt}`
      ),
      '',
      '(c) 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'archive-report.pdf'
    a.click()
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Archive</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-600 to-gray-800 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Archive className="w-7 h-7" /> Document Archive
            </h1>
            <button onClick={handleDownloadAllPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
              <Download className="w-4 h-4" /> PDF Report
            </button>
          </div>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-green-50 text-green-600 text-sm mb-4 text-center">{success}</div>
        )}

        {/* Upload */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
          <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer">
            <Upload className="w-10 h-10 mx-auto mb-2 text-slate-500" />
            <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload documents to archive'}</p>
            <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <FileText className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{documents.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Archive className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatSize(documents.reduce((s, d) => s + d.size, 0))}</p>
            <p className="text-xs text-muted-foreground">Total Size</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">100%</p>
            <p className="text-xs text-muted-foreground">Stored</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search archived documents..." />
        </div>

        {/* Document List */}
        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No archived documents</p>
            <p className="text-sm text-muted-foreground mt-1">Upload documents to store them here</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {filtered.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-4 border-b hover:bg-neutral-50">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(doc.size)} • {doc.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewDoc(doc)} className="p-2 text-blue-500" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => downloadDoc(doc)} className="p-2 text-green-500" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteDoc(doc.id)} className="p-2 text-red-500" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}