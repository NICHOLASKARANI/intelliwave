'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  ArrowUpDown, FileEdit, Sparkles, Clock, Shield, AlertTriangle, Timer,
} from 'lucide-react'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const priorityStyle = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/40 text-red-300 border-red-700'
    case 'HIGH': return 'bg-orange-900/40 text-orange-300 border-orange-700'
    case 'MEDIUM': return 'bg-blue-900/40 text-blue-300 border-blue-700'
    default: return 'bg-neutral-800 text-neutral-400 border-neutral-700'
  }
}

export default function SLAPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const blank = { name: '', description: '', priority: 'MEDIUM', firstResponseHours: '4', resolutionHours: '24', businessHoursOnly: true, active: true }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/sla')
      const data = await res.json()
      setPolicies(data.policies || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (p: any) => {
    setForm({
      name: p.name || '', description: p.description || '', priority: p.priority || 'MEDIUM',
      firstResponseHours: String(p.firstResponseHours || 4), resolutionHours: String(p.resolutionHours || 24),
      businessHoursOnly: p.businessHoursOnly !== false, active: p.active !== false,
    })
    setEditing(p); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name required'); return }
    try {
      const url = editing ? '/api/wavecore/helpdesk/sla/' + editing.id : '/api/wavecore/helpdesk/sla'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, firstResponseHours: Number(form.firstResponseHours), resolutionHours: Number(form.resolutionHours) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Policy updated' : 'Policy created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete policy "' + name + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/helpdesk/sla/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Policy deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const toggle = async (p: any) => {
    await fetch('/api/wavecore/helpdesk/sla/' + p.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    flash(p.active ? 'Policy paused' : 'Policy activated')
    fetchAll()
  }

  const filtered = useMemo(() => {
    let list = [...policies]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(p => (p.name || '').toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s))
    }
    return list
  }, [policies, search])

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · SLA Policies</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Shield className="w-7 h-7 text-green-400" /> SLA Policies
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Response & resolution targets by priority</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-900/40">
              <Plus className="w-5 h-5" /> New Policy
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <Shield className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total Policies</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active || 0}</p><p className="text-xs opacity-90">Active</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <Timer className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgFirstResponseHours || 0}h</p><p className="text-xs opacity-90">Avg Response</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResolutionHours || 0}h</p><p className="text-xs opacity-90">Avg Resolution</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inactive || 0}</p><p className="text-xs opacity-90">Paused</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policies..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No SLA policies yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Policy
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className={'bg-neutral-900 rounded-2xl border p-5 flex flex-wrap justify-between items-center gap-3 ' + (p.active ? 'border-green-800' : 'border-neutral-800 opacity-60')}>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white">{p.name}</p>
                    <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold border ' + priorityStyle(p.priority)}>{p.priority}</span>
                    {p.active ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/40 text-green-300 border border-green-700">ACTIVE</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">PAUSED</span>}
                  </div>
                  {p.description && <p className="text-xs text-neutral-400">{p.description}</p>}
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">First Response</p>
                    <p className="text-lg font-bold text-white">{p.firstResponseHours}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Resolution</p>
                    <p className="text-lg font-bold text-white">{p.resolutionHours}h</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggle(p)} className="p-2 rounded-lg bg-blue-900/40 text-blue-300 hover:bg-blue-800 text-xs font-bold">{p.active ? 'Pause' : 'Activate'}</button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                  <button onClick={() => del(p.id, p.name)} disabled={deleting === p.id} className="p-2 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800">
                    {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" /> {editing ? 'Edit Policy' : 'New SLA Policy'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-green-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Urgent Response" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Priority Tier</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">First Response (h)</label>
                  <input type="number" min="0.5" step="0.5" value={form.firstResponseHours} onChange={e => setForm({ ...form, firstResponseHours: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Resolution (h)</label>
                  <input type="number" min="1" step="1" value={form.resolutionHours} onChange={e => setForm({ ...form, resolutionHours: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.businessHoursOnly} onChange={e => setForm({ ...form, businessHoursOnly: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm text-white">Business hours only</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm text-white">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Policy'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}