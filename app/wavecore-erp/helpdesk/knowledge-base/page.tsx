'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  ArrowUpDown, FileEdit, Sparkles, Eye, ThumbsUp, EyeIcon, FileText,
} from 'lucide-react'

const CATEGORIES = ['GENERAL', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'FEATURE', 'FAQ']
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

export default function KBPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const blank = { title: '', body: '', category: 'GENERAL', tags: '', status: 'DRAFT' }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/knowledge-base')
      const data = await res.json()
      setArticles(data.articles || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (a: any) => {
    setForm({ title: a.title || '', body: a.body || '', category: a.category || 'GENERAL', tags: a.tags || '', status: a.status || 'DRAFT' })
    setEditing(a); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.body.trim()) { setError('Body required'); return }
    try {
      const url = editing ? '/api/wavecore/helpdesk/knowledge-base/' + editing.id : '/api/wavecore/helpdesk/knowledge-base'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Article updated' : 'Article created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete article "' + title + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/helpdesk/knowledge-base/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Article deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/helpdesk/knowledge-base/' + id)
    const data = await res.json()
    if (data.article) setDetail(data.article)
  }

  const vote = async (id: string, helpful: boolean) => {
    await fetch('/api/wavecore/helpdesk/knowledge-base/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(helpful ? { helpful: 1 } : { notHelpful: 1 }),
    })
    flash(helpful ? 'Marked helpful' : 'Feedback recorded')
    fetchAll()
  }

  const filtered = useMemo(() => {
    let list = [...articles]
    if (filterCategory !== 'ALL') list = list.filter(a => a.category === filterCategory)
    if (filterStatus !== 'ALL') list = list.filter(a => a.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(a => (a.title || '').toLowerCase().includes(s) || (a.body || '').toLowerCase().includes(s) || (a.tags || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [articles, filterCategory, filterStatus, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  const statusStyle = (s: string) => {
    switch (s) {
      case 'PUBLISHED': return 'bg-green-900/40 text-green-300 border-green-700'
      case 'DRAFT': return 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
      case 'ARCHIVED': return 'bg-neutral-800 text-neutral-400 border-neutral-700'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Knowledge Base</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <BookOpen className="w-7 h-7 text-purple-400" /> Knowledge Base
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Self-service articles · Search · Voting</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40">
              <Plus className="w-5 h-5" /> New Article
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg">
            <BookOpen className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total Articles</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.published || 0}</p><p className="text-xs opacity-90">Published</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
            <FileText className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.drafts || 0}</p><p className="text-xs opacity-90">Drafts</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
            <EyeIcon className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalViews || 0}</p><p className="text-xs opacity-90">Total Views</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg">
            <ThumbsUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalHelpful || 0}</p><p className="text-xs opacity-90">Helpful Votes</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No articles yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Write First Article
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(a => (
              <div key={a.id} className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900 hover:border-purple-600 hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + statusStyle(a.status)}>{a.status}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1 rounded bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-3 h-3" /></button>
                    <button onClick={() => del(a.id, a.title)} disabled={deleting === a.id} className="p-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800">
                      {deleting === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <button onClick={() => openDetail(a.id)} className="text-left w-full">
                  <h3 className="font-bold text-white mb-2 hover:text-purple-400">{a.title}</h3>
                  <p className="text-xs text-neutral-400 line-clamp-3 mb-3">{a.body.slice(0, 140)}...</p>
                </button>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-3 border-t border-neutral-800">
                  <span className="uppercase tracking-wide">{a.category}</span>
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.views || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {a.helpful || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> {editing ? 'Edit Article' : 'New Article'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-purple-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="setup, configuration, faq" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Body *</label>
                <textarea rows={12} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono text-sm" placeholder="Write the article content here..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">{editing ? 'Save Changes' : 'Publish'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-5 border-b border-neutral-800">
              <div>
                <h2 className="text-2xl font-bold text-white">{detail.title}</h2>
                <p className="text-xs text-neutral-500 mt-1 uppercase">{detail.category} · {detail.status} · {detail.views || 0} views</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-purple-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">{detail.body}</p>
            </div>
            <div className="p-5 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-xs text-neutral-500">Was this helpful?</span>
              <div className="flex gap-2">
                <button onClick={() => { vote(detail.id, true); setDetail(null) }} className="px-4 py-2 rounded-xl bg-green-900/50 text-green-300 hover:bg-green-800 text-sm font-bold">Yes 👍</button>
                <button onClick={() => { vote(detail.id, false); setDetail(null) }} className="px-4 py-2 rounded-xl bg-red-900/50 text-red-300 hover:bg-red-800 text-sm font-bold">No 👎</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}