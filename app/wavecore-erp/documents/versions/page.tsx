'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GitBranch, Download, Upload, Loader2, FileText, Trash2, History, Plus } from 'lucide-react'

interface DocumentVersion {
  id: string
  name: string
  version: number
  size: string
  uploadedAt: string
  status: 'CURRENT' | 'PREVIOUS'
}

export default function VersionControlPage() {
  const [documents, setDocuments] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)

  // Load from localStorage - ZERO data until user uploads
  useEffect(() => {
    const saved = localStorage.getItem('version-control-docs')
    if (saved) {
      setDocuments(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('version-control-docs', JSON.stringify(documents))
    }
  }, [documents, loading])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    setTimeout(() => {
      const existing = documents.find(d => d.name === file.name)
      const newDoc: DocumentVersion = {
        id: Date.now().toString(),
        name: file.name,
        version: existing ? existing.version + 1 : 1,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toLocaleString(),
        status: 'CURRENT',
      }

      // Mark previous version as PREVIOUS
      setDocuments(prev => [
        newDoc,
        ...prev.map(d => d.name === file.name ? { ...d, status: 'PREVIOUS' as const } : d),
      ])

      setFileName('')
      setUploading(false)
    }, 1000)
  }

  const deleteDocument = (id: string) => {
    if (!confirm('Delete this document version?')) return
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Version Control',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Documents: ' + documents.length,
      '='.repeat(50),
      '',
      ...documents.map((d, i) => 
        `Document #${i+1}\n  Name: ${d.name}\n  Version: v${d.version}\n  Size: ${d.size}\n  Status: ${d.status}\n  Uploaded: ${d.uploadedAt}\n` + '-'.repeat(30)
      ),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'version-control.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Version Control</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-violet-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GitBranch className="w-7 h-7" /> Version Control
            </h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
          <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload document (new version if exists)'}</p>
            <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <FileText className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{documents.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <History className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{documents.filter(d => d.status === 'PREVIOUS').length}</p>
            <p className="text-xs text-muted-foreground">Previous Versions</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Plus className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{documents.filter(d => d.status === 'CURRENT').length}</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload your first document to start version tracking</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {documents.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-4 border-b hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">v{doc.version} • {doc.size} • {doc.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === 'CURRENT' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-500'
                  }`}>{doc.status}</span>
                  <button onClick={() => deleteDocument(doc.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}