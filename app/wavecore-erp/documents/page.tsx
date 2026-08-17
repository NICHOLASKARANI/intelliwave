'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FileText, Plus, Search, Trash2, Loader2, Download, Upload, AlertCircle, CheckCircle,
  FolderOpen, Star, Clock, Share2, Archive, HardDrive, File, Image as FileImage,
  FileCode, FileSpreadsheet, TrendingUp, Shield, Eye, Edit3
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
  const [category, setCategory] = useState('General')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        body: JSON.stringify({ name, url, type, size: 0, projectId: null }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Document uploaded!'); setShowAdd(false); setName(''); setUrl(''); fetchDocuments() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try { await fetch(`/api/wavecore/documents/${id}`, { method: 'DELETE' }); fetchDocuments() } catch {}
  }

  const filtered = documents.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))

  const totalSize = documents.reduce((s, d) => s + (d.size || 0), 0)

  const folders = [
    { name: 'Contracts', count: documents.filter(d => d.type === 'CONTRACT').length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { name: 'Invoices', count: documents.filter(d => d.type === 'INVOICE').length, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { name: 'Reports', count: documents.filter(d => d.type === 'REPORT').length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { name: 'General', count: documents.filter(d => d.type === 'DOCUMENT').length, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  ]

  const sideNav = [
    { label: 'All Documents', href: '/wavecore-erp/documents', icon: FileText, active: true },
    { label: 'Recent', href: '/wavecore-erp/documents/recent', icon: Clock },
    { label: 'Shared', href: '/wavecore-erp/documents/shared', icon: Share2 },
    { label: 'Starred', href: '/wavecore-erp/documents/starred', icon: Star },
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <nav className="space-y-1">
            {sideNav.map(item => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${item.active ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-6 pt-6 border-t">
            <p className="px-4 text-xs font-semibold text-muted-foreground mb-3">STORAGE</p>
            <div className="px-4">
              <div className="flex justify-between text-xs mb-2">
                <span>{formatSize(totalSize)}</span>
                <span>5 GB</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min((totalSize / (5 * 1024 * 1024)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-6 lg:p-8 mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" /> Document Management
            </h1>
            <p className="text-white/80 text-sm">Storage • OCR • Version Control • E-Signatures</p>
          </div>

          {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
          {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <FileText className="w-6 h-6 text-blue-500 mb-3" />
              <p className="text-2xl font-bold">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <HardDrive className="w-6 h-6 text-cyan-500 mb-3" />
              <p className="text-2xl font-bold">{formatSize(totalSize)}</p>
              <p className="text-xs text-muted-foreground">Storage Used</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <FolderOpen className="w-6 h-6 text-purple-500 mb-3" />
              <p className="text-2xl font-bold">{folders.length}</p>
              <p className="text-xs text-muted-foreground">Folders</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Share2 className="w-6 h-6 text-green-500 mb-3" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Shared</p>
            </div>
          </div>

          {/* Folders */}
          <h2 className="text-lg font-bold mb-4">Folders</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {folders.map(f => (
              <div key={f.name} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-all cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                  <FolderOpen className={`w-5 h-5 ${f.color}`} />
                </div>
                <p className="font-medium text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.count} files</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search documents..." />
            </div>
            <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-cyan-600"><Upload className="w-4 h-4" /> Upload</Button>
          </div>

          {showAdd && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Document name" />
                </div>
                <div><label className="block text-sm font-medium mb-2">URL *</label>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="https://..." />
                </div>
                <div><label className="block text-sm font-medium mb-2">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                    <option value="DOCUMENT">Document</option><option value="CONTRACT">Contract</option>
                    <option value="INVOICE">Invoice</option><option value="REPORT">Report</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleAdd} className="mt-4">Upload Document</Button>
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" /></div>
          ) : filtered.length > 0 ? (
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
                    <button className="p-2 text-muted-foreground hover:text-amber-500"><Star className="w-4 h-4" /></button>
                    <button className="p-2 text-muted-foreground hover:text-blue-500"><Share2 className="w-4 h-4" /></button>
                    <a href={d.url} target="_blank" className="p-2 text-blue-500"><Download className="w-4 h-4" /></a>
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const kb = bytes / 1024
  if (kb < 1024) return kb.toFixed(1) + ' KB'
  const mb = kb / 1024
  return mb.toFixed(1) + ' MB'
}