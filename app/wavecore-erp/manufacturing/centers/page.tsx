'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Cog, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Activity, FileEdit, ChevronRight, Sparkles,
  Gauge, DollarSign, Zap, AlertTriangle, Cog as CogIcon,
} from 'lucide-react'

export default function CentersPage() {
  const [centers, setCenters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    name: '', code: '', description: '', capacity: '0', efficiency: '100', costPerHour: '0',
  })

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/manufacturing/centers')
      const data = await res.json()
      if (!res.ok) {
        setError('API error: ' + (data.error || res.status))
        setCenters([])
      } else {
        setCenters(data.centers || [])
      }
    } catch (e: any) {
      setError('Network error: ' + (e?.message || 'unknown'))
    }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({ name: '', code: '', description: '', capacity: '0', efficiency: '100', costPerHour: '0' })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }

  const openEdit = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/centers/' + id)
    const data = await res.json()
    if (!data.center) return
    const c = data.center
    setForm({
      name: c.name || '',
      code: c.code || '',
      description: c.description || '',
      capacity: String(c.capacity || 0),
      efficiency: String(Math.round(Number(c.efficiency || 0) * 100)),
      costPerHour: String(c.costPerHour || 0),
    })
    setEditing(c)
    setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required'); return }
    try {
      const url = editing ? '/api/wavecore/manufacturing/centers/' + editing.id : '/api/wavecore/manufacturing/centers'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity || 0),
          efficiency: Number(form.efficiency || 0),
          costPerHour: Number(form.costPerHour || 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Work Center updated' : 'Work Center created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete work center ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/centers/' + id, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed'); return }
      flash('Deleted'); fetchAll()
    } finally { setDeleting('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' work center(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/centers/' + id, { method: 'DELETE' })
    }
    setSelected(new Set()); flash('Bulk delete complete'); fetchAll()
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/centers/' + id)
    const data = await res.json()
    setDetail(data)
  }

  const pdf = (id: string) => window.open('/api/wavecore/manufacturing/centers/' + id + '/pdf', '_blank')

  const summary = useMemo(() => {
    const total = centers.length
    const active = centers.filter(c => Number(c.activeWorkOrders) > 0).length
    const idle = total - active
    const totalCapacity = centers.reduce((s, c) => s + Number(c.capacity || 0), 0)
    const totalLoad = centers.reduce((s, c) => s + Number(c.openQty || 0), 0)
    const utilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0
    const avgEfficiency = total > 0 ? Math.round(centers.reduce((s, c) => s + Number(c.efficiency || 0), 0) / total * 100) : 0
    const avgCost = total > 0 ? Math.round(centers.reduce((s, c) => s + Number(c.costPerHour || 0), 0) / total) : 0
    const totalOpenQty = centers.reduce((s, c) => s + Number(c.openQty || 0), 0)
    return { total, active, idle, totalCapacity, totalLoad, utilization, avgEfficiency, avgCost, totalOpenQty }
  }, [centers])

  const filtered = useMemo(() => {
    let list = [...centers]
    if (activeKpi === 'ACTIVE') list = list.filter(c => Number(c.activeWorkOrders) > 0)
    else if (activeKpi === 'IDLE') list = list.filter(c => Number(c.activeWorkOrders) === 0)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.code || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [centers, activeKpi, search, sortBy, sortDir])

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
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Work Centers</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Cog className="w-7 h-7 text-amber-500" /> Work Centers
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Production capacity · Load balancing · Efficiency</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-900/40">
              <Plus className="w-5 h-5" /> Create Work Center
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-amber-300' : '')}>
            <Cog className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('ACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'ACTIVE' ? 'ring-4 ring-green-300' : '')}>
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active}</p><p className="text-xs opacity-90">Loaded</p>
          </button>
          <button onClick={() => setActiveKpi('IDLE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-slate-600 to-neutral-800 text-white shadow-lg ' + (activeKpi === 'IDLE' ? 'ring-4 ring-slate-300' : '')}>
            <CogIcon className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.idle}</p><p className="text-xs opacity-90">Idle</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-800 text-white shadow-lg">
            <Gauge className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.utilization}%</p><p className="text-xs opacity-90">Utilization</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white shadow-lg">
            <Zap className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgEfficiency}%</p><p className="text-xs opacity-90">Avg Efficiency</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgCost}</p><p className="text-xs opacity-90">Avg Cost/hr</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-800 text-white shadow-lg">
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalOpenQty}</p><p className="text-xs opacity-90">Open Qty</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code..."
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
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Cog className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No work centers match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[['name','Name'],['code','Code'],['capacity','Capacity'],['efficiency','Efficiency'],['costPerHour','Cost/hr'],['activeWorkOrders','Open WOs'],['openQty','Queue']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const loadPct = Number(c.capacity) > 0 ? Math.min(999, Math.round((Number(c.openQty || 0) / Number(c.capacity)) * 100)) : 0
                    const loaded = Number(c.activeWorkOrders) > 0
                    return (
                      <tr key={c.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                        <td className="p-3 text-white">
                          <button onClick={() => openDetail(c.id)} className="hover:text-amber-400 inline-flex items-center gap-1 font-medium">
                            {c.name} <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="p-3 font-mono text-xs text-neutral-400">{c.code || '—'}</td>
                        <td className="p-3 text-right text-white">{Number(c.capacity || 0)}</td>
                        <td className="p-3 text-right">
                          <span className="text-amber-300 font-bold">{Math.round(Number(c.efficiency || 0) * 100)}%</span>
                        </td>
                        <td className="p-3 text-right text-neutral-200">{Number(c.costPerHour || 0).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (loaded ? 'bg-green-900/40 text-green-300 border border-green-700' : 'bg-neutral-800 text-neutral-400')}>{Number(c.activeWorkOrders || 0)}</span>
                        </td>
                        <td className="p-3 w-32">
                          <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div className={'h-2 rounded-full ' + (loadPct > 90 ? 'bg-red-500' : loadPct > 70 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: Math.min(100, loadPct) + '%' }}></div>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1">{loadPct}% load</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => pdf(c.id)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => openEdit(c.id)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                            <button onClick={() => del(c.id, c.name)} disabled={deleting === c.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                              {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> {editing ? 'Edit Work Center' : 'New Work Center'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Assembly Line 1" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="auto if blank" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Capacity (units/period)</label>
                <input type="number" min="0" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Efficiency (%)</label>
                <input type="number" min="0" max="200" value={form.efficiency} onChange={e => setForm({ ...form, efficiency: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Cost / Hour</label>
                <input type="number" step="0.01" min="0" value={form.costPerHour} onChange={e => setForm({ ...form, costPerHour: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="What this center produces..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Work Center'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Work Center Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', detail.center?.name],
                  ['Code', detail.center?.code],
                  ['Capacity', detail.center?.capacity],
                  ['Efficiency', Math.round(Number(detail.center?.efficiency || 0) * 100) + '%'],
                  ['Cost/hr', Number(detail.center?.costPerHour || 0).toFixed(2)],
                  ['Created', detail.center?.createdAt ? new Date(detail.center.createdAt).toLocaleDateString('en-GB') : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.center?.description && (
                <div className="bg-neutral-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Description</div>
                  <div className="text-sm text-white">{detail.center.description}</div>
                </div>
              )}
              {detail.workOrders && detail.workOrders.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide mb-2">Assigned Work Orders ({detail.workOrders.length})</h3>
                  <div className="space-y-2">
                    {detail.workOrders.map((w: any, i: number) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-mono text-white">{w.number}</div>
                          <div className="text-xs text-neutral-400">{w.productId || '—'}</div>
                        </div>
                        <div className="text-right">
                          <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (w.status === 'COMPLETED' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300')}>{w.status}</span>
                          <div className="text-xs text-neutral-400 mt-1">{w.completedQty || 0}/{w.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => pdf(detail.center.id)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Work Center PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}