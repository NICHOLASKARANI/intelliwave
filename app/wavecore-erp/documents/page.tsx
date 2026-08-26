'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FileText, Download, Loader2, Scan, GitBranch, PenTool,
  Layers, Scissors, Minimize2, RefreshCw, Stamp, Archive,
  Upload, FolderOpen, Search, Star, Trash2, Clock
, GitBranch } from 'lucide-react'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/documents')
      .then(r => r.json())
      .then(d => setDocuments(d.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Document Management', '='.repeat(50), `Documents: ${documents.length}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'documents.pdf'; a.click()
  }

  const tools = [
    { name: 'OCR Scanner', href: '/wavecore-erp/documents/ocr', icon: Scan, color: 'from-blue-500 to-indigo-600', desc: 'Extract text' },
    { name: 'Version Control', href: '/wavecore-erp/documents/versions', icon: GitBranch, color: 'from-purple-500 to-violet-600', desc: 'Track changes' },
    { name: 'E-Signatures', href: '/wavecore-erp/documents/signatures', icon: PenTool, color: 'from-green-500 to-emerald-600', desc: 'Sign digitally' },
    { name: 'Merge PDFs', href: '/wavecore-erp/documents/merge', icon: Layers, color: 'from-pink-500 to-rose-600', desc: 'Combine files' },
    { name: 'Split PDFs', href: '/wavecore-erp/documents/split', icon: Scissors, color: 'from-amber-500 to-orange-600', desc: 'Divide files' },
    { name: 'Compress', href: '/wavecore-erp/documents/compress', icon: Minimize2, color: 'from-teal-500 to-cyan-600', desc: 'Reduce size' },
    { name: 'Convert', href: '/wavecore-erp/documents/convert', icon: RefreshCw, color: 'from-indigo-500 to-blue-600', desc: 'Format change' },
    { name: 'Watermark', href: '/wavecore-erp/documents/watermark', icon: Stamp, color: 'from-violet-500 to-purple-600', desc: 'Add stamps' },
    { name: 'Archive', href: '/wavecore-erp/documents/archive', icon: Archive, color: 'from-slate-500 to-gray-600', desc: 'Storage' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Documents</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8" /> Document Management
              </h1>
              <p className="text-white/80 text-sm">9 Tools • OCR • Merge • Sign • Compress</p>
            </div>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><FolderOpen className="w-8 h-8 text-blue-500 mb-3" /><p className="text-3xl font-extrabold">{documents.length}</p><p className="text-xs">Documents</p></div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><Star className="w-8 h-8 text-amber-500 mb-3" /><p className="text-3xl font-extrabold">0</p><p className="text-xs">Starred</p></div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><Clock className="w-8 h-8 text-green-500 mb-3" /><p className="text-3xl font-extrabold">0</p><p className="text-xs">Recent</p></div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><Upload className="w-8 h-8 text-purple-500 mb-3" /><p className="text-3xl font-extrabold">9</p><p className="text-xs">Tools</p></div>
            </div>

            <h2 className="text-xl font-bold mb-4">Document Tools (9)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tools.map(tool => {
                const Icon = tool.icon
                return (
                  <Link key={tool.name} href={tool.href}
                    className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-2xl transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-lg">{tool.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{tool.desc}</p>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}