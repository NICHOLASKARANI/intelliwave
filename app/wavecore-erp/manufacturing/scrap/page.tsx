'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, TrendingDown, DollarSign, Package, Activity, FileEdit, Sparkles,
} from 'lucide-react'

const REASONS = ['DEFECT', 'REWORK', 'DAMAGE', 'EXPIRY', 'OTHER']

const reasonStyle = (r: string) => {
  switch (r) {
    case 'DEFECT': return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'REWORK': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'DAMAGE': return 'bg-orange-900/40 text-orange-300 border border-orange-700'
    case 'EXPIRY': return 'bg-purple-900/40 text-purple-300 border border-purple-700'
    default: return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

export default function ScrapPage() {
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [byReason, setByReason] = useState<any[]>([])
  const [byProduct, setByProduct] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterReason, setFilterReason] = useState('ALL')
  const [sortBy, setSortBy] = useState('scrapDate')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    productName: '', workOrderNumber: '', quantity: '', unitCost: '',
    reason: 'DEFECT', scrapDate: new Date().toISOString().slice(0, 10), notes: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/scrap')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setRecords([]) }
      else {
        setRecords(data.records || [])
        setSummary(data.summary || {})
        setByReason(data.byReason || [])
        setByProduct(data.byProduct || [])
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    productName: '', workOrderNumber: '', quantity: '', unitCost: '',
    reason: 'DEFECT', scrapDate: new Date().toISOString().slice(0, 10), notes: '',
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/scrap/' + id)
    const data = await res.json()
    if (!data.record) return
    const r = data.record
    setForm({
      productName: r.productName || '',
      workOrderNumber: r.workOrderNumber || '',
      quantity: String(r.quantity || ''),
      unitCost: String(r.unitCost || ''),
      reason: r.reason || 'DEFECT',
      scrapDate: r.scrapDate ? r.scrapDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: r.notes || '',
    })
    setEditing(r)
    setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.productName.trim()) { setError('Product name is required'); return }
    const qty = Number(form.quantity || 0)
    if (qty <= 0) { setError('Quantity must be greater than 0'); return }

    const payload = {
      ...form,
      quantity: qty,
      unitCost: Number(form.unitCost || 0),
    }

    try {
      const url = editing ? '/api/wavecore/manufacturing/scrap/' + editing.id : '/api/wavecore/manufacturing/scrap'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Record updated' : 'Scrap recorded')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, label: string) => {
    if (!confirm('Delete scrap record for ' + label + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/scrap/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' record(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/scrap/' + id, { method: 'DELETE' })
    }
    setSelected(new Set()); flash('Bulk delete complete'); fetchAll()
  }

  const pdf = () => window.open('/api/wavecore/manufacturing/scrap/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...records]
    if (activeKpi === 'THIS_MONTH') {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      list = list.filter(r => r.scrapDate && new Date(r.scrapDate) >= monthStart)
    } else if (activeKpi === 'HIGH_VALUE') {
      list = list.filter(r => Number(r.totalCost || 0) > 1000)
    } else if (activeKpi !== 'ALL' && REASONS.includes(activeKpi)) {
      list = list.filter(r => r.reason === activeKpi)
    }
    if (filterReason !== 'ALL') list = list.filter(r => r.reason === filterReason)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.productName || '').toLowerCase().includes(s) ||
        (r.workOrderNumber || '').toLowerCase().includes(s) ||
        (r.notes || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [records, activeKpi, filterReason, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
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
          <span className="text-sm text-neutral-400">Manufacturing · Scrap & Rework</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <AlertTriangle className="w-7 h-7 text-red-500" /> Scrap & Rework
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Defect tracking · Cost analysis · Top offenders</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-900/40">
              <Plus className="w-5 h-5" /> Record Scrap
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Events</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-orange-600 to-red-800 text-white shadow-lg">
            <Package className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalQty || 0}</p><p className="text-xs opacity-90">Qty Scrapped</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalCost || 0}</p><p className="text-xs opacity-90">Total Value</p>
          </div>
          <button onClick={() => setActiveKpi('THIS_MONTH')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'THIS_MONTH' ? 'ring-4 ring-yellow-300' : '')}>
            <TrendingDown className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.thisMonthCost || 0}</p><p className="text-xs opacity-90">This Month</p>
          </button>
          <button onClick={() => setActiveKpi('HIGH_VALUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'HIGH_VALUE' ? 'ring-4 ring-indigo-300' : '')}>
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgCostPerEvent || 0}</p><p className="text-xs opacity-90">Avg / Event</p>
          </button>
          <button onClick={() => setActiveKpi(summary.topReason || 'ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg transition-all hover:scale-105 ' + (REASONS.includes(activeKpi) ? 'ring-4 ring-teal-300' : '')}>
            <FileEdit className="w-5 h-5 mb-2" /><p className="text-lg font-bold truncate">{summary.topReason || '—'}</p><p className="text-xs opacity-90">Top Reason</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-slate-600 to-neutral-800 text-white shadow-lg">
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-lg font-bold truncate">{summary.topProduct || '—'}</p><p className="text-xs opacity-90">Top Product</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product, WO or notes..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterReason} onChange={e => setFilterReason(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Reasons</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="px-3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">
                Delete {selected.size}
              </button>
            )}
          </div>
        </div>

        {byReason.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-3">Scrap by Reason</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {byReason.map(r => {
                const maxCost = Math.max(...byReason.map(x => x.cost), 1)
                const pct = Math.round((r.cost / maxCost) * 100)
                return (
                  <div key={r.reason} className="bg-neutral-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + reasonStyle(r.reason)}>{r.reason}</span>
                      <span className="text-xs text-neutral-400">{r.count}x</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2 mb-1">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                    </div>
                    <div className="text-xs text-white font-bold">{Math.round(r.cost).toLocaleString()}</div>
                    <div className="text-[10px] text-neutral-500">{r.qty.toFixed(1)} units</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-red-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No scrap records match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[['scrapDate','Date'],['productName','Product'],['workOrderNumber','Work Order'],['quantity','Qty'],['unitCost','Unit Cost'],['totalCost','Total Cost'],['reason','Reason'],['notes','Notes']].map(([f,label]) => (
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
                      <td className="p-3 text-xs text-neutral-400">{r.scrapDate ? new Date(r.scrapDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-white font-medium">{r.productName}</td>
                      <td className="p-3 font-mono text-xs text-neutral-400">{r.workOrderNumber || '—'}</td>
                      <td className="p-3 text-right text-white">{Number(r.quantity).toFixed(1)}</td>
                      <td className="p-3 text-right text-neutral-300">{Number(r.unitCost || 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-red-400 font-bold">{Number(r.totalCost || 0).toFixed(2)}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + reasonStyle(r.reason)}>{r.reason}</span></td>
                      <td className="p-3 text-xs text-neutral-500 max-w-[180px] truncate">{r.notes || '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(r.id)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(r.id, r.productName)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
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
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-400" /> {editing ? 'Edit Scrap Record' : 'Record Scrap'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Product Name *</label>
                <input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Type product name..." />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Work Order #</label>
                <input value={form.workOrderNumber} onChange={e => setForm({ ...form, workOrderNumber: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Reason</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Quantity *</label>
                <input type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Unit Cost</label>
                <input type="number" min="0" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Date</label>
                <input type="date" value={form.scrapDate} onChange={e => setForm({ ...form, scrapDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Details of the scrap event..." />
              </div>
              {Number(form.quantity) > 0 && Number(form.unitCost) > 0 && (
                <div className="md:col-span-2 p-3 rounded-xl bg-red-900/20 border border-red-800 text-sm text-white">
                  Total Cost: <b>{(Number(form.quantity) * Number(form.unitCost)).toFixed(2)}</b>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">{editing ? 'Save Changes' : 'Record Scrap'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}