'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { FileText, Folder, Upload, Search, Star, Trash2, Grid, List, Plus, Loader2, X } from 'lucide-react'

type Doc = {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  fileUrl: string
  thumbnailUrl?: string
  category?: string
  isStarred: boolean
  version: number
  createdAt: string
  folderId?: string
}

type Folder = { id: string; name: string; color?: string; documentCount?: number }
type Stats = { total: number; starred: number; trashed: number; archived: number; totalSize: string }

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch('/api/wavecore/documents?limit=200' + (selectedFolder ? '&folderId=' + selectedFolder : '')),
        fetch('/api/wavecore/documents/folders'),
      ])
      if (docsRes.ok) {
        const d = await docsRes.json()
        setDocuments(d.documents || [])
        setStats(d.stats || null)
      }
      if (foldersRes.ok) {
        const d = await foldersRes.json()
        setFolders(d.folders || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [selectedFolder])

  const filtered = useMemo(() => {
    if (!search) return documents
    const s = search.toLowerCase()
    return documents.filter(d =>
      d.originalName.toLowerCase().includes(s) ||
      (d.category || '').toLowerCase().includes(s)
    )
  }, [documents, search])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setMsg('')
    for (const file of Array.from(files)) {
      try {
        // Upload to existing blob endpoint
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/wavecore/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          setMsg('Upload failed: ' + (uploadData.error || 'Unknown'))
          continue
        }
        // Save metadata
        await fetch('/api/wavecore/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadData.fileName || file.name,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            fileUrl: uploadData.url || uploadData.fileUrl,
            blobKey: uploadData.blobKey,
            folderId: selectedFolder,
          }),
        })
      } catch (e: any) {
        setMsg('Upload failed: ' + e.message)
      }
    }
    setUploading(false)
    setShowUpload(false)
    loadData()
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const res = await fetch('/api/wavecore/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      })
      if (res.ok) {
        setNewFolderName('')
        setShowNewFolder(false)
        loadData()
      }
    } catch {}
  }

  const toggleStar = async (id: string, isStarred: boolean) => {
    try {
      await fetch('/api/wavecore/documents/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !isStarred }),
      })
      loadData()
    } catch {}
  }

  const trashDocument = async (id: string) => {
    if (!confirm('Move to trash?')) return
    try {
      await fetch('/api/wavecore/documents/' + id, { method: 'DELETE' })
      loadData()
    } catch {}
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400" /> Documents
            </h1>
            <p className="text-slate-400">Store, organize, and share your files</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewFolder(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-2">
              <Folder className="w-4 h-4" /> New Folder
            </button>
            <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload
            </button>
          </div>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{msg}</div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
              <p className="text-xs text-blue-300 uppercase">Total</p>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
              <p className="text-xs text-yellow-300 uppercase">Starred</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.starred}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-xs text-red-300 uppercase">Trashed</p>
              <p className="text-2xl font-bold text-red-400">{stats.trashed}</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
              <p className="text-xs text-purple-300 uppercase">Storage</p>
              <p className="text-2xl font-bold text-purple-400">{formatSize(Number(stats.totalSize))}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {/* Sidebar folders */}
          <div className="w-64 hidden md:block">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-24">
              <h2 className="text-sm font-bold mb-3 text-slate-400 uppercase">Folders</h2>
              <button
                onClick={() => setSelectedFolder(null)}
                className={'w-full text-left px-3 py-2 rounded-xl text-sm mb-1 ' + (selectedFolder === null ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-slate-800')}
              >
                All Files ({documents.length})
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className={'w-full text-left px-3 py-2 rounded-xl text-sm mb-1 flex items-center gap-2 ' + (selectedFolder === f.id ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-slate-800')}
                >
                  <Folder className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-xs text-slate-500">{f.documentCount || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>
              <button onClick={() => setViewMode('grid')} className={'p-2 rounded-xl ' + (viewMode === 'grid' ? 'bg-blue-500' : 'bg-slate-900 text-slate-400')}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={'p-2 rounded-xl ' + (viewMode === 'list' ? 'bg-blue-500' : 'bg-slate-900 text-slate-400')}>
                <List className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No documents yet</p>
                <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm">
                  Upload First File
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map(d => (
                  <div key={d.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 group">
                    <Link href={'/wavecore-erp/documents/' + d.id}>
                      <div className="aspect-square bg-slate-800 rounded-xl mb-3 flex items-center justify-center">
                        {d.thumbnailUrl ? (
                          <img src={d.thumbnailUrl} alt={d.originalName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <FileText className="w-12 h-12 text-slate-600" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate mb-1">{d.originalName}</p>
                      <p className="text-xs text-slate-500">{formatSize(d.fileSize)} · v{d.version}</p>
                    </Link>
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleStar(d.id, d.isStarred)} className="p-1 hover:bg-slate-800 rounded">
                        <Star className={'w-3 h-3 ' + (d.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500')} />
                      </button>
                      <button onClick={() => trashDocument(d.id)} className="p-1 hover:bg-red-500/20 rounded ml-auto">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                {filtered.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
                    <FileText className="w-8 h-8 text-blue-400 shrink-0" />
                    <Link href={'/wavecore-erp/documents/' + d.id} className="flex-1 min-w-0">
                      <p className="font-medium truncate">{d.originalName}</p>
                      <p className="text-xs text-slate-500">{formatSize(d.fileSize)} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </Link>
                    <button onClick={() => toggleStar(d.id, d.isStarred)} className="p-1">
                      <Star className={'w-4 h-4 ' + (d.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500')} />
                    </button>
                    <button onClick={() => trashDocument(d.id)} className="p-1">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowUpload(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Upload Documents</h2>
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 transition"
                   onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Click to select files</p>
                <p className="text-xs text-slate-500 mt-2">Multiple files supported</p>
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
              {uploading && (
                <div className="mt-4 text-center">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-400 mt-2">Uploading...</p>
                </div>
              )}
              <button onClick={() => setShowUpload(false)} className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* New folder modal */}
        {showNewFolder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowNewFolder(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">New Folder</h2>
              <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowNewFolder(false)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
                <button onClick={createFolder} className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}