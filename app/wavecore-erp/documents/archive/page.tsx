'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Archive, Loader2, FileText, Download, Trash2, Printer,
  AlertCircle, Search, Eye, RotateCcw, Calendar,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  fileName: string
  fileUrl: string | null
  fileSize: number
  category: string | null
  status: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export default function ArchivePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/wavecore/documents?status=ARCHIVED&limit=500', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setDocuments(json.documents || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const restore = async (doc: Document) => {
    if (!confirm('Restore "' + doc.name + '" from archive?')) return
    setBusy(doc.id); setError('')
    try {
      const res = await fetch('/api/wavecore/documents/' + doc.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ status: 'ACTIVE', isArchived: false }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Restore failed'); return }
      load()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const remove = async (doc: Document) => {
    if (!confirm('Permanently delete "' + doc.name + '"? This cannot be undone.')) return
    setBusy(doc.id); setError('')
    try {
      const res = await fetch('/api/wavecore/documents/' + doc.id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Delete failed'); return }
      load()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const filtered = documents.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.fileName || '').toLowerCase().includes(search.toLowerCase())
  )

  const printList = () => window.print()
  const fmtBytes = (b: number) => { if (!b) return '—'; if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(2) + ' MB' }
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-KE') : '—'

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Archive className="w-5 h-5 text-neutral-600" /> Archived</h1>
          <button onClick={printList} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">Archived Documents</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}

        <div className="mb-4 relative print:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search archived documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-sm"
          />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-500">
              {search ? 'No archived documents match "' + search + '"' : 'No archived documents yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-left px-4 py-3">Archived</th>
                    <th className="text-right px-4 py-3 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-neutral-400" /> {doc.name}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{doc.category || '—'}</td>
                      <td className="px-4 py-3 text-xs">{fmtBytes(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(doc.updatedAt || doc.createdAt)}</td>
                      <td className="px-4 py-3 text-right print:hidden">
                        <div className="flex gap-1 justify-end">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold" title="View">
                              <Eye className="w-3 h-3 inline" />
                            </a>
                          )}
                          <button onClick={() => restore(doc)} disabled={busy === doc.id} className="px-2 py-1 rounded-lg bg-green-50 text-green-600 text-xs font-bold disabled:opacity-40" title="Restore">
                            <RotateCcw className="w-3 h-3 inline" />
                          </button>
                          <button onClick={() => remove(doc)} disabled={busy === doc.id} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold disabled:opacity-40" title="Delete">
                            <Trash2 className="w-3 h-3 inline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}