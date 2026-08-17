'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FileText, Plus, Search, Trash2, Loader2, Download, Upload, AlertCircle, CheckCircle,
  FolderOpen, Star, Clock, Share2, Archive, HardDrive, ScanText, GitBranch, Pen,
  Shield, Eye, Grid3X3, List
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('DOCUMENT')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  async function fetchDocuments() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/documents')
      if (res.ok) { const data = await res.json(); setDocuments(data.documents || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchDocuments() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!name || !url) { setError('Name and URL required'); return }
    try {
      const res = await fetch('/api/wavecore/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, type, size: 0 }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess('Document uploaded!')
        setShowAdd(false); setName(''); setUrl('')
        fetchDocuments()
      } else { setError(data.error || 'Failed to upload') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try { await fetch(`/api/wavecore/documents/${id}`, { method: 'DELETE' }); fetchDocuments() } catch {}
  }

  const filtered = documents.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))

  const tools = [
    { label: 'OCR Scanner', href: '/wavecore-erp/documents/ocr', icon: ScanText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950', desc: 'Extract text from images' },
    { label: 'Version Control', href: '/wavecore-erp/documents/versions', icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', desc: 'Track document history' },
    { label: 'E-Signatures', href: '/wavecore-erp/documents/signatures', icon: Pen, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', desc: 'Request signatures' },
    { label: 'Archive', href: '/wavecore-erp/documents/archive', icon: Archive, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', desc: 'Archived documents' },
  ]

  const typeIcons: Record<string, any> = {
    DOCUMENT: FileText, CONTRACT: FileText, INVOICE: FileText, REPORT: FileText,
  }

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
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><FileText className="w-8 h-8" /> Document Management</h1>
              <p className="text-white/80 text-sm">Storage • OCR • Version Control • E-Signatures</p>
            </div>
            <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-white text-cyan-700 hover:bg-gray-100">
              <Upload className="w-4 h-4" /> Upload Document
            </Button>
          </div>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-2xl">
            <h3 className="font-bold mb-4 text-lg">Upload Document</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Document Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="e.g., Contract Agreement" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Document URL *</label>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="https://..." />
              </div>
              <div className="col-span-2"><label className="block text-sm font-medium mb-2">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="DOCUMENT">Document</option><option value="CONTRACT">Contract</option>
                  <option value="INVOICE">Invoice</option><option value="REPORT">Report</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4 gap-2"><Upload className="w-4 h-4" /> Upload</Button>
          </div>
        )}

        {/* Tools */}
        <h2 className="text-lg font-bold mb-4">Document Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {tools.map(tool => {
            const Icon = tool.icon
            return (
              <Link key={tool.label} href={tool.href}
                className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-cyan-300 hover:shadow-lg transition-all group">
                <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <p className="font-medium text-sm">{tool.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Search + View Toggle */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search documents..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-neutral-800'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-neutral-800'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Documents Display */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(d => {
                const DocIcon = typeIcons[d.type] || FileText
                return (
                  <div key={d.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <DocIcon className="w-8 h-8 text-cyan-500" />
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="font-medium text-sm truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d.type} • {new Date(d.createdAt).toLocaleDateString()}</p>
                    <a href={d.url} target="_blank" className="mt-3 inline-block text-xs text-cyan-600 hover:text-cyan-700"><Download className="w-3 h-3 inline mr-1" /> Download</a>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              {filtered.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.type} • {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={d.url} target="_blank" className="p-2 text-blue-500"><Download className="w-4 h-4" /></a>
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Upload your first document</p>
            <Button onClick={() => setShowAdd(true)} className="gap-2 bg-cyan-600"><Upload className="w-4 h-4" /> Upload Document</Button>
          </div>
        )}
      </main>
    </div>
  )
}