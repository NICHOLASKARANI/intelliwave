'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  FileEdit, Sparkles, Copy, Hash, FolderOpen,
} from 'lucide-react'

const CATEGORIES = ['GENERAL', 'BILLING', 'TECHNICAL', 'SALES', 'SUPPORT', 'FOLLOWUP']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const blank = { title: '', body: '', category: 'GENERAL', shortcut: '' }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (t: any) => {
    setForm({ title: t.title || '', body: t.body || '', category: t.category || 'GENERAL', shortcut: t.shortcut || '' })
    setEditing(t); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.body.trim()) { setError('Body required'); return }
    try {
      const url = editing ? '/api/wavecore/helpdesk/templates/' + editing.id : '/api/wavecore/helpdesk/templates'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Template updated' : 'Template created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete template "' + title + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/helpdesk/templates/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Template deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const copyBody = (body: string) => {
    navigator.clipboard.writeText(body)
    flash('Copied to clipboard')
  }

  const filtered = useMemo(() => {
    let list = [...templates]
    if (filterCategory !== 'ALL') list = list.filter(t => t.category === filterCategory)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t => (t.title || '').toLowerCase().includes(s) || (t.body || '').toLowerCase().includes(s))
    }
    return list
  }, [templates, filterCategory, search])

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Canned Responses</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <FileText className="w-7 h-7 text-teal-400" /> Templates
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Pre-written responses · Reusable · Copy-to-clipboard</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-teal-900/40">
              <Plus className="w-5 h-5" /> New Template
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 gap-3 mb-6 md:w-1/2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white shadow-lg">
            <FileText className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Templates</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <FolderOpen className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.categories || 0}</p><p className="text-xs opacity-90">Categories</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-teal-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No templates yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 hover:border-teal-600 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-900/40 text-teal-300">{t.category}</span>
                    {t.shortcut && <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono"><Hash className="w-3 h-3" />{t.shortcut}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => copyBody(t.body)} className="p-1 rounded bg-blue-900/40 text-blue-300 hover:bg-blue-800" title="Copy body"><Copy className="w-3 h-3" /></button>
                    <button onClick={() => openEdit(t)} className="p-1 rounded bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-3 h-3" /></button>
                    <button onClick={() => del(t.id, t.title)} disabled={deleting === t.id} className="p-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800">
                      {deleting === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-white mb-2">{t.title}</h3>
                <p className="text-xs text-neutral-400 whitespace-pre-wrap line-clamp-4">{t.body.slice(0, 180)}...</p>
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
                <Sparkles className="w-5 h-5 text-teal-400" /> {editing ? 'Edit Template' : 'New Template'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-teal-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Welcome Response" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Shortcut</label>
                  <input value={form.shortcut} onChange={e => setForm({ ...form, shortcut: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. /welcome" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Body *</label>
                <textarea rows={8} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono text-sm" placeholder="Hi {{customer_name}}, thank you for reaching out..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Template'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}