'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, GitBranch, Loader2, Download, Trash2, Printer, AlertCircle,
  CheckCircle2, Upload, FileText, Clock, User,
} from 'lucide-react'

interface Version {
  id: string
  documentId: string
  versionNumber: number
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedByName: string | null
  notes: string | null
  createdAt: string
}

interface DocOption {
  id: string
  name: string
  currentVersion: number
}

export default function VersionControlPage() {
  const [documents, setDocuments] = useState<DocOption[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (selectedId) loadVersions()
    else setVersions([])
  }, [selectedId])

  const loadDocuments = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/wavecore/documents?limit=500', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load documents'); return }
      const docs = (json.documents || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        currentVersion: Number(d.currentVersion || d.version || 1),
      }))
      setDocuments(docs)
      if (docs.length > 0 && !selectedId) setSelectedId(docs[0].id)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const loadVersions = async () => {
    setError('')
    try {
      const res = await fetch('/api/wavecore/documents/' + selectedId + '/versions', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load versions'); return }
      setVersions(json.versions || [])
    } catch { setError('Network error') }
  }

  const remove = async (version: Version) => {
    const current = documents.find(d => d.id === selectedId)?.currentVersion || 1
    if (version.versionNumber === current) {
      setError('Cannot delete the current version. Upload a new version first.')
      return
    }
    if (!confirm('Delete version ' + version.versionNumber + ' (' + version.fileName + ')? This cannot be undone.')) return
    setBusy(version.id); setError('')
    try {
      const res = await fetch('/api/wavecore/documents/' + selectedId + '/versions?versionId=' + version.id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Delete failed'); return }
      flash('Version deleted')
      loadVersions()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const printHistory = () => window.print()

  const fmtBytes = (b: number) => {
    if (!b) return '—'
    if (b < 1024) return b + ' B'
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1024 / 1024).toFixed(2) + ' MB'
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString('en-KE') : '—'

  const selectedDoc = documents.find(d => d.id === selectedId)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/documents" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Documents
          </Link>
          <h1 className="font-bold flex items-center gap-2"><GitBranch className="w-5 h-5 text-purple-500" /> Version Control</h1>
          <button onClick={printHistory} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800">
          <h2 className="text-xl font-bold">Version History {selectedDoc ? '- ' + selectedDoc.name : ''}</h2>
          <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 print:hidden"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-4 print:hidden">
          <label className="block text-xs font-bold text-neutral-500 mb-2">Select Document</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-sm">
            <option value="">— choose a document —</option>
            {documents.map(d => <option key={d.id} value={d.id}>{d.name} (v{d.currentVersion})</option>)}
          </select>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
          ) : !selectedId ? (
            <div className="p-12 text-center text-sm text-neutral-500">Select a document to view its version history.</div>
          ) : versions.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-500">No versions yet for this document.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="text-left px-4 py-3">Version</th>
                    <th className="text-left px-4 py-3">File</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-left px-4 py-3">Uploaded by</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Notes</th>
                    <th className="text-right px-4 py-3 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map(v => {
                    const isCurrent = v.versionNumber === (selectedDoc?.currentVersion || 1)
                    return (
                      <tr key={v.id} className={'border-t ' + (isCurrent ? 'bg-purple-50 dark:bg-purple-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50')}>
                        <td className="px-4 py-3 font-mono font-bold">v{v.versionNumber} {isCurrent && <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700 font-bold">CURRENT</span>}</td>
                        <td className="px-4 py-3 text-xs">{v.fileName}</td>
                        <td className="px-4 py-3 text-xs">{fmtBytes(v.fileSize)}</td>
                        <td className="px-4 py-3 text-xs">{v.uploadedByName || '—'}</td>
                        <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(v.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-neutral-500">{v.notes || '—'}</td>
                        <td className="px-4 py-3 text-right print:hidden">
                          <div className="flex gap-1 justify-end">
                            {v.fileUrl && (
                              <a href={v.fileUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                                <Download className="w-3 h-3 inline" />
                              </a>
                            )}
                            {!isCurrent && (
                              <button onClick={() => remove(v)} disabled={busy === v.id} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold disabled:opacity-40">
                                <Trash2 className="w-3 h-3 inline" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}