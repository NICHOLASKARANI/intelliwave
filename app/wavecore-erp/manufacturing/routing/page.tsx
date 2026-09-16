'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Route, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Activity, FileEdit, ChevronRight, Sparkles, Clock,
  TrendingUp, Copy, Cog, Layers,
} from 'lucide-react'

export default function RoutingPage() {
  const [routings, setRoutings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [cloning, setCloning] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    name: '', code: '', productId: '',
    operations: [{ sequence: '1', name: '', description: '', workCenterId: '', setupMinutes: '0', durationMinutes: '0' }] as any[],
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/routing')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setRoutings([]) }
      else setRoutings(data.routings || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    name: '', code: '', productId: '',
    operations: [{ sequence: '1', name: '', description: '', workCenterId: '', setupMinutes: '0', durationMinutes: '0' }],
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }

  const openEdit = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/routing/' + id)
    const data = await res.json()
    if (!data.routing) return
    setForm({
      name: data.routing.name || '',
      code: data.routing.code || '',
      productId: data.routing.productId || '',
      operations: (data.operations || []).map((o: any) => ({
        sequence: String(o.sequence || 1),
        name: o.name || '',
        description: o.description || '',
        workCenterId: o.workCenterId || '',
        setupMinutes: String(o.setupMinutes || 0),
        durationMinutes: String(o.durationMinutes || 0),
      })),
    })
    setEditing(data.routing)
    setShowCreate(true)
  }

  const addRow = () => setForm({
    ...form,
    operations: [...form.operations, {
      sequence: String(form.operations.length + 1),
      name: '', description: '', workCenterId: '', setupMinutes: '0', durationMinutes: '0',
    }],
  })
  const removeRow = (i: number) => setForm({
    ...form,
    operations: form.operations.filter((_, idx) => idx !== i),
  })
  const updateRow = (i: number, key: string, val: string) => {
    const copy = [...form.operations]
    copy[i] = { ...copy[i], [key]: val }
    setForm({ ...form, operations: copy })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Routing name is required'); return }
    if (!form.productId.trim()) { setError('Product name is required'); return }
    const validOps = form.operations.filter(o => o.name.trim())
    if (validOps.length === 0) { setError('Add at least one operation with a name'); return }

    const payload = {
      name: form.name,
      code: form.code,
      productId: form.productId,
      operations: validOps.map((o, i) => ({
        sequence: i + 1,
        name: o.name,
        description: o.description,
        workCenterId: o.workCenterId,
        setupMinutes: Number(o.setupMinutes || 0),
        durationMinutes: Number(o.durationMinutes || 0),
      })),
    }

    try {
      const url = editing ? '/api/wavecore/manufacturing/routing/' + editing.id : '/api/wavecore/manufacturing/routing'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Routing updated' : 'Routing created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, label: string) => {
    if (!confirm('Delete routing ' + label + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/routing/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const clone = async (id: string, name: string) => {
    if (!confirm('Clone routing ' + name + '?')) return
    setCloning(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/routing/' + id, { method: 'POST' })
      if (res.ok) { flash('Cloned'); fetchAll() }
    } finally { setCloning('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' routing(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/routing/' + id, { method: 'DELETE' })
    }
    setSelected(new Set()); flash('Bulk delete complete'); fetchAll()
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/routing/' + id)
    const data = await res.json()
    setDetail(data)
  }

  const pdf = (id: string) => window.open('/api/wavecore/manufacturing/routing/' + id + '/pdf', '_blank')

  const summary = useMemo(() => {
    const total = routings.length
    const withOps = routings.filter(r => Number(r.operationCount) > 0).length
    const empty = total - withOps
    const totalOps = routings.reduce((s, r) => s + Number(r.operationCount || 0), 0)
    const avgOps = total > 0 ? Math.round((totalOps / total) * 10) / 10 : 0
    const totalDuration = routings.reduce((s, r) => s + Number(r.totalDuration || 0), 0)
    const totalSetup = routings.reduce((s, r) => s + Number(r.totalSetup || 0), 0)
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0
    return { total, withOps, empty, totalOps, avgOps, totalDuration, totalSetup, avgDuration }
  }, [routings])

  const filtered = useMemo(() => {
    let list = [...routings]
    if (activeKpi === 'WITH') list = list.filter(r => Number(r.operationCount) > 0)
    else if (activeKpi === 'EMPTY') list = list.filter(r => Number(r.operationCount) === 0)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(s) ||
        (r.code || '').toLowerCase().includes(s) ||
        (r.productId || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [routings, activeKpi, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }
  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Routing</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Route className="w-7 h-7 text-teal-500" /> Routing
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Operations sequences · Work centers · Time analysis</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-teal-900/40">
              <Plus className="w-5 h-5" /> Create Routing
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-teal-300' : '')}>
            <Route className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('WITH')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'WITH' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.withOps}</p><p className="text-xs opacity-90">With Ops</p>
          </button>
          <button onClick={() => setActiveKpi('EMPTY')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-slate-600 to-neutral-800 text-white shadow-lg ' + (activeKpi === 'EMPTY' ? 'ring-4 ring-slate-300' : '')}>
            <FileEdit className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.empty}</p><p className="text-xs opacity-90">Empty</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <Cog className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalOps}</p><p className="text-xs opacity-90">Operations</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg">
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgOps}</p><p className="text-xs opacity-90">Avg Ops</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalDuration}m</p><p className="text-xs opacity-90">Duration</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalSetup}m</p><p className="text-xs opacity-90">Setup</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code or product..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="px-3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">
                Delete {selected.size}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-teal-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Route className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No routings match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[['name','Name'],['code','Code'],['productId','Product'],['operationCount','Ops'],['totalDuration','Duration'],['totalSetup','Setup'],['createdAt','Created']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                      <td className="p-3 text-white">
                        <button onClick={() => openDetail(r.id)} className="hover:text-teal-400 inline-flex items-center gap-1 font-medium">
                          {r.name} <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-3 font-mono text-xs text-neutral-400">{r.code || '—'}</td>
                      <td className="p-3 text-neutral-200">{r.productId || '—'}</td>
                      <td className="p-3 text-right text-white font-bold">{Number(r.operationCount || 0)}</td>
                      <td className="p-3 text-right text-amber-300">{Number(r.totalDuration || 0)} min</td>
                      <td className="p-3 text-right text-cyan-300">{Number(r.totalSetup || 0)} min</td>
                      <td className="p-3 text-xs text-neutral-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => pdf(r.id)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(r.id)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => clone(r.id, r.name)} disabled={cloning === r.id} className="p-1.5 rounded-lg bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800" title="Clone">
                            {cloning === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => del(r.id, r.name)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                            {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-5xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" /> {editing ? 'Edit Routing' : 'New Routing'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Routing Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Laptop Assembly Route" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="auto if blank" />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Product Name *</label>
                <input value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Type product name..." />
              </div>
            </div>

            <div className="px-6 pb-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Operations Sequence *
                </h3>
                <button type="button" onClick={addRow} className="text-xs px-3 py-1.5 rounded-lg bg-teal-900/50 hover:bg-teal-800 text-teal-200 font-bold">+ Add Operation</button>
              </div>
              <div className="space-y-2">
                {form.operations.map((o, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input type="number" min="1" value={o.sequence} onChange={e => updateRow(i, 'sequence', e.target.value)} className="col-span-1 px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm text-center" title="Sequence" />
                    <input placeholder="Operation name" value={o.name} onChange={e => updateRow(i, 'name', e.target.value)} className="col-span-3 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <input placeholder="Work center" value={o.workCenterId} onChange={e => updateRow(i, 'workCenterId', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <input type="number" placeholder="Setup (min)" value={o.setupMinutes} onChange={e => updateRow(i, 'setupMinutes', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <input type="number" placeholder="Duration (min)" value={o.durationMinutes} onChange={e => updateRow(i, 'durationMinutes', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <button type="button" onClick={() => removeRow(i)} disabled={form.operations.length === 1} className="col-span-2 p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-30 flex items-center justify-center gap-1 text-xs">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800 mt-4">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Routing'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Routing Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', detail.routing?.name],
                  ['Code', detail.routing?.code],
                  ['Product', detail.routing?.productId],
                  ['Operations', detail.operations?.length ?? 0],
                  ['Total Setup', (detail.totals?.setup ?? 0) + ' min'],
                  ['Total Duration', (detail.totals?.duration ?? 0) + ' min'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>

              {detail.operations && detail.operations.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Cog className="w-4 h-4" /> Operations Sequence
                  </h3>
                  <div className="space-y-2">
                    {detail.operations.map((o: any, i: number) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-900/60 text-teal-300 flex items-center justify-center text-xs font-bold">{o.sequence ?? i + 1}</span>
                            <span className="text-sm font-bold text-white">{o.name}</span>
                          </div>
                          <span className="text-xs text-teal-300 font-bold">{Number(o.durationMinutes || 0) + Number(o.setupMinutes || 0)} min</span>
                        </div>
                        {o.workCenterId && <div className="text-xs text-neutral-400 mt-1 ml-8">Work Center: {o.workCenterId}</div>}
                        {o.description && <div className="text-xs text-neutral-500 mt-1 ml-8">{o.description}</div>}
                        <div className="text-xs text-neutral-500 mt-1 ml-8">
                          Setup: {Number(o.setupMinutes || 0)} min · Duration: {Number(o.durationMinutes || 0)} min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => pdf(detail.routing.id)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Routing PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}