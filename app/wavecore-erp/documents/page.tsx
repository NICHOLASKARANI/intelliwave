'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText, Download, Loader2, Search, Star, Trash2, Clock, Upload,
  FolderOpen, HardDrive, Layers, Scissors, Minimize2, RefreshCw, Stamp,
  Archive, Scan, GitBranch, PenTool, Lock, Unlock, FileSearch, Crop,
  RotateCw, FileType, FileImage, FileSpreadsheet, FileBarChart, Sparkles,
  Languages, Brain, Share2, MoreHorizontal, Grid3x3, List, Eye,
  ChevronRight, Zap, CheckCircle2, AlertTriangle, X, Plus, Workflow,
  Combine, Calculator, Quote, Flag, Tag, FileEdit, FilePlus, Save,
} from 'lucide-react'

const TOOL_CATEGORIES = {
  ORGANIZE: { label: 'Organize PDF', color: 'from-blue-500 to-indigo-600' },
  OPTIMIZE: { label: 'Optimize PDF', color: 'from-green-500 to-emerald-600' },
  CONVERT:  { label: 'Convert PDF',  color: 'from-purple-500 to-fuchsia-600' },
  EDIT:     { label: 'Edit PDF',     color: 'from-amber-500 to-orange-600' },
  SECURITY: { label: 'PDF Security', color: 'from-red-500 to-rose-600' },
  AI:       { label: 'PDF Intelligence', color: 'from-cyan-500 to-teal-600' },
}

const TOOLS = [
  // ORGANIZE
  { name: 'Merge PDF',        href: '/wavecore-erp/documents/tools/merge',      icon: Layers,         category: 'ORGANIZE', desc: 'Combine multiple PDFs' },
  { name: 'Split PDF',        href: '/wavecore-erp/documents/tools/split',      icon: Scissors,       category: 'ORGANIZE', desc: 'Extract pages' },
  { name: 'Organize PDF',     href: '/wavecore-erp/documents/tools/organize',   icon: GitBranch,      category: 'ORGANIZE', desc: 'Reorder / delete pages' },
  { name: 'Rotate PDF',       href: '/wavecore-erp/documents/tools/rotate',     icon: RotateCw,       category: 'ORGANIZE', desc: 'Rotate pages' },
  { name: 'Crop PDF',         href: '/wavecore-erp/documents/tools/crop',       icon: Crop,           category: 'ORGANIZE', desc: 'Trim margins' },
  { name: 'Page Numbers',     href: '/wavecore-erp/documents/tools/page-numbers', icon: Tag,          category: 'ORGANIZE', desc: 'Add page numbers' },

  // OPTIMIZE
  { name: 'Compress PDF',     href: '/wavecore-erp/documents/tools/compress',   icon: Minimize2,      category: 'OPTIMIZE', desc: 'Reduce file size' },
  { name: 'Repair PDF',       href: '/wavecore-erp/documents/tools/repair',     icon: RefreshCw,      category: 'OPTIMIZE', desc: 'Recover damaged PDF' },

  // CONVERT
  { name: 'JPG to PDF',       href: '/wavecore-erp/documents/tools/jpg-to-pdf', icon: FileImage,      category: 'CONVERT',  desc: 'Convert images to PDF' },
  { name: 'PDF to Text',      href: '/wavecore-erp/documents/tools/pdf-to-text', icon: FileType,      category: 'CONVERT',  desc: 'Extract text' },
  { name: 'PDF to Markdown',  href: '/wavecore-erp/documents/tools/pdf-to-md',  icon: Quote,          category: 'CONVERT',  desc: 'Convert to Markdown' },
  { name: 'Markdown to PDF',  href: '/wavecore-erp/documents/tools/md-to-pdf',  icon: FileText,       category: 'CONVERT',  desc: 'Markdown → PDF' },
  { name: 'HTML to PDF',      href: '/wavecore-erp/documents/tools/html-to-pdf', icon: FileBarChart,  category: 'CONVERT',  desc: 'Webpage → PDF' },
  { name: 'PDF to PDF/A',     href: '/wavecore-erp/documents/tools/pdf-to-pdfa', icon: Archive,       category: 'CONVERT',  desc: 'Archive standard' },
  { name: 'PDF to Word',      href: '/wavecore-erp/documents/tools/pdf-to-word', icon: FileEdit,      category: 'CONVERT',  desc: 'Coming soon · CloudConvert' },
  { name: 'Word to PDF',      href: '/wavecore-erp/documents/tools/word-to-pdf', icon: FileText,      category: 'CONVERT',  desc: 'Coming soon · CloudConvert' },
  { name: 'PDF to Excel',     href: '/wavecore-erp/documents/tools/pdf-to-excel', icon: FileSpreadsheet, category: 'CONVERT', desc: 'Coming soon · CloudConvert' },
  { name: 'Excel to PDF',     href: '/wavecore-erp/documents/tools/excel-to-pdf', icon: FileSpreadsheet, category: 'CONVERT', desc: 'Coming soon · CloudConvert' },

  // EDIT
  { name: 'Edit PDF',         href: '/wavecore-erp/documents/tools/edit',       icon: FileEdit,       category: 'EDIT',     desc: 'Annotate + edit' },
  { name: 'Watermark',        href: '/wavecore-erp/documents/tools/watermark',  icon: Stamp,          category: 'EDIT',     desc: 'Add watermark' },
  { name: 'Sign PDF',         href: '/wavecore-erp/documents/tools/sign',       icon: PenTool,        category: 'EDIT',     desc: 'E-signature workflow' },
  { name: 'Redact PDF',       href: '/wavecore-erp/documents/tools/redact',     icon: FileSearch,     category: 'EDIT',     desc: 'Remove sensitive content' },

  // SECURITY
  { name: 'Protect PDF',      href: '/wavecore-erp/documents/tools/protect',    icon: Lock,           category: 'SECURITY', desc: 'Add password' },
  { name: 'Unlock PDF',       href: '/wavecore-erp/documents/tools/unlock',     icon: Unlock,         category: 'SECURITY', desc: 'Remove password' },

  // AI
  { name: 'OCR PDF',          href: '/wavecore-erp/documents/tools/ocr',        icon: Scan,           category: 'AI',       desc: 'Extract text from scans' },
  { name: 'AI Summarize',     href: '/wavecore-erp/documents/tools/summarize',  icon: Brain,          category: 'AI',       desc: 'Generate summary' },
  { name: 'Translate PDF',    href: '/wavecore-erp/documents/tools/translate',  icon: Languages,      category: 'AI',       desc: 'Multi-language' },
  { name: 'AI Statistics',    href: '/wavecore-erp/documents/tools/statistics', icon: Calculator,     category: 'AI',       desc: 'Word / reading analysis' },
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [categories, setCategories] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeTool, setActiveTool] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'tools' | 'documents'>('tools')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch('/api/wavecore/documents'),
        fetch('/api/wavecore/documents/folders?mode=flat'),
      ])
      const docsData = await docsRes.json()
      const foldersData = await foldersRes.json()
      setDocuments(docsData.documents || [])
      setSummary(docsData.summary || {})
      setCategories(docsData.categories || [])
      setFolders(foldersData.folders || [])
    } catch { setError('Failed to load documents') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const deleteDoc = async (id: string, name: string) => {
    if (!confirm('Delete "' + name + '"? This cannot be undone.')) return
    const csrf = document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
    const res = await fetch('/api/wavecore/documents/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf },
    })
    if (res.ok) { flash('Deleted'); fetchAll() }
  }

  const toggleStar = async (doc: any) => {
    const csrf = document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
    await fetch('/api/wavecore/documents/' + doc.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ isStarred: !doc.isStarred }),
    })
    flash(doc.isStarred ? 'Unstarred' : 'Starred')
    fetchAll()
  }

  const pdf = () => window.print()

  const filteredTools = useMemo(() => {
    let list = [...TOOLS]
    if (activeTool !== 'ALL' && activeTool !== 'DOCS') list = list.filter(t => t.category === activeTool)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s))
    }
    return list
  }, [activeTool, search])

  const filteredDocs = useMemo(() => {
    let list = [...documents]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(d => (d.name || '').toLowerCase().includes(s) || (d.tags || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [documents, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  const storagePct = summary.totalBytes ? Math.min(100, Math.round((summary.totalBytes / (1024 * 1024 * 1024)) * 100)) : 0

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Documents</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* HERO */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 p-6 lg:p-8 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8" /> Document Management
              </h1>
              <p className="text-white/80 text-sm">
                Every tool you need to work with PDFs in one place · 30+ free tools
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold">
                <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
              </button>
              <button onClick={pdf} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold">
                <Download className="w-4 h-4" /> Report
              </button>
              <Link href="/wavecore-erp/documents/upload" className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-indigo-700 text-sm font-bold shadow-lg">
                <Upload className="w-4 h-4" /> Upload
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <button onClick={() => { setView('documents'); setActiveTool('ALL') }} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (view === 'documents' ? 'ring-4 ring-indigo-300' : '')}>
            <FileText className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Documents</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white shadow-lg">
            <HardDrive className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalMB || 0}</p><p className="text-xs opacity-90">MB Used</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <Star className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.starred || 0}</p><p className="text-xs opacity-90">Starred</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.recent || 0}</p><p className="text-xs opacity-90">Recent</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <FolderOpen className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{folders.length}</p><p className="text-xs opacity-90">Folders</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-rose-600 to-pink-800 text-white shadow-lg">
            <Workflow className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{TOOLS.length}</p><p className="text-xs opacity-90">Tools</p>
          </div>
        </div>

        {/* STORAGE BAR */}
        <div className="mb-8 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Storage Used</span>
            <span className="text-xs text-neutral-500">{summary.totalMB || 0} MB / 1 GB</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: storagePct + '%' }}></div>
          </div>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <div className="flex gap-1 bg-neutral-900 rounded-xl p-1">
            <button onClick={() => setView('tools')} className={'px-4 py-2 rounded-lg text-sm font-bold transition ' + (view === 'tools' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white')}>
              <Zap className="w-3 h-3 inline mr-1" /> All Tools
            </button>
            <button onClick={() => setView('documents')} className={'px-4 py-2 rounded-lg text-sm font-bold transition ' + (view === 'documents' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white')}>
              <FolderOpen className="w-3 h-3 inline mr-1" /> My Documents
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={view === 'tools' ? 'Search tools...' : 'Search documents...'}
                className="pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm w-64 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ==================== TOOLS VIEW ==================== */}
        {view === 'tools' && (
          <>
            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setActiveTool('ALL')} className={'px-4 py-2 rounded-xl text-xs font-bold transition ' + (activeTool === 'ALL' ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800')}>
                All Tools ({TOOLS.length})
              </button>
              {Object.entries(TOOL_CATEGORIES).map(([key, cat]) => {
                const count = TOOLS.filter(t => t.category === key).length
                return (
                  <button key={key} onClick={() => setActiveTool(key)} className={'px-4 py-2 rounded-xl text-xs font-bold transition ' + (activeTool === key ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800')}>
                    {cat.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Tools grid */}
            {filteredTools.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
                <Search className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                <p className="text-neutral-400">No tools match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTools.map(tool => {
                  const Icon = tool.icon
                  const catInfo = TOOL_CATEGORIES[tool.category as keyof typeof TOOL_CATEGORIES]
                  return (
                    <Link key={tool.name} href={tool.href} className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-indigo-600 hover:shadow-2xl transition-all">
                      <div className={'w-12 h-12 rounded-xl bg-gradient-to-br ' + catInfo.color + ' flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-bold text-white text-sm">{tool.name}</p>
                      <p className="text-xs text-neutral-500 mt-1">{tool.desc}</p>
                      {tool.desc.startsWith('Coming soon') && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 text-[10px] font-bold">COMING SOON</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ==================== DOCUMENTS VIEW ==================== */}
        {view === 'documents' && (
          <>
            {loading ? (
              <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                <p className="text-neutral-400 mb-4">No documents yet</p>
                <Link href="/wavecore-erp/documents/upload" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Your First Document
                </Link>
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-800">
                      <tr>
                        {[['name','Name'],['category','Category'],['folderName','Folder'],['fileSize','Size'],['createdAt','Created']].map(([f,label]) => (
                          <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                            {label}
                          </th>
                        ))}
                        <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map(d => (
                        <tr key={d.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                              <span className="text-white font-medium truncate max-w-xs">{d.name}</span>
                              {d.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            </div>
                          </td>
                          <td className="p-3"><span className="px-2 py-1 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-bold">{d.category}</span></td>
                          <td className="p-3 text-xs text-neutral-400">{d.folderName || '—'}</td>
                          <td className="p-3 text-right text-xs text-neutral-400">{Math.round((d.fileSize || 0) / 1024)} KB</td>
                          <td className="p-3 text-xs text-neutral-400">{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                          <td className="p-3">
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => toggleStar(d)} className={'p-1.5 rounded-lg ' + (d.isStarred ? 'bg-amber-900/50 text-amber-300' : 'bg-neutral-800 text-neutral-400 hover:text-amber-300')} title="Star">
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <Link href={'/wavecore-erp/documents/' + d.id} className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-indigo-400" title="View">
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <button onClick={() => deleteDoc(d.id, d.name)} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}