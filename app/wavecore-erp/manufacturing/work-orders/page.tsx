'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Factory, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Clock, AlertTriangle, Package, Activity, PlayCircle,
  FileEdit, ChevronRight, Sparkles, TrendingUp
} from 'lucide-react'

type WO = any

const STATUSES = ['ALL', 'DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const TYPES = ['ALL', 'MANUFACTURING', 'ASSEMBLY', 'PACKAGING']
const PRIORITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']

const statusColor = (s: string) => {
  switch (s) {
    case 'DRAFT': return 'bg-amber-900/40 text-amber-300 border border-amber-700'
    case 'RELEASED': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    case 'IN_PROGRESS': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'CANCELLED': return 'bg-red-900/40 text-red-300 border border-red-700'
    default: return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}
const priorityColor = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/60 text-red-200 border border-red-700'
    case 'HIGH': return 'bg-orange-900/50 text-orange-300 border border-orange-700'
    case 'MEDIUM': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'LOW': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WO[]>([])
  const [products, setProducts] = useState<WO[]>([])
  const [workCenters, setWorkCenters] = useState<WO[]>([])
  const [boms, setBoms] = useState<WO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')

  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [busy, setBusy] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    productId: '', quantity: '', type: 'MANUFACTURING', priority: 'MEDIUM',
    startDate: '', endDate: '', workCenterId: '', bomId: '', notes: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [o, p, wc, b] = await Promise.all([
        fetch('/api/wavecore/manufacturing/work-orders').then(r => r.json()).catch(() => ({ workOrders: [] })),
        fetch('/api/wavecore/inventory/products').then(r => r.json()).catch(() => ({ products: [] })),
        fetch('/api/wavecore/manufacturing/centers').then(r => r.json()).catch(() => ({ workCenters: [] })),
        fetch('/api/wavecore/manufacturing/bom').then(r => r.json()).catch(() => ({ boms: [] })),
      ])
      setOrders(o.workOrders || [])
      setProducts(p.products || [])
      setWorkCenters(wc.workCenters || wc.centers || [])
      setBoms(b.boms || [])
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.productId) { setError('Select a product'); return }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Quantity must be > 0'); return }
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Work order ' + data.workOrder.number + ' created')
      setShowCreate(false)
      setForm({ productId: '', quantity: '', type: 'MANUFACTURING', priority: 'MEDIUM', startDate: '', endDate: '', workCenterId: '', bomId: '', notes: '' })
      fetchAll()
    } catch { setError('Network error') }
  }

  const patchOrder = async (id: string, patch: any, label: string) => {
    setBusy(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      if (res.ok) { flash(label); fetchAll() }
    } finally { setBusy('') }
  }

  const deleteOrder = async (id: string, number: string) => {
    if (!confirm('Delete work order ' + number + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' work order(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/work-orders/' + id, { method: 'DELETE' })
    }
    setSelected(new Set())
    flash('Bulk delete complete')
    fetchAll()
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/work-orders/' + id)
    const data = await res.json()
    setDetail(data)
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/manufacturing/work-orders/' + id + '/pdf', '_blank')
  }

  const summary = useMemo(() => {
    const now = new Date()
    const total = orders.length
    const draft = orders.filter(o => o.status === 'DRAFT').length
    const released = orders.filter(o => o.status === 'RELEASED').length
    const inProg = orders.filter(o => o.status === 'IN_PROGRESS').length
    const completed = orders.filter(o => o.status === 'COMPLETED').length
    const overdue = orders.filter(o => o.endDate && new Date(o.endDate) < now && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length
    const onTimeBase = orders.filter(o => o.status === 'COMPLETED').length
    const onTimeHit = orders.filter(o => o.status === 'COMPLETED' && o.endDate && new Date(o.updatedAt) <= new Date(o.endDate)).length
    const onTimePct = onTimeBase > 0 ? Math.round((onTimeHit / onTimeBase) * 100) : 100
    return { total, draft, released, inProg, completed, overdue, onTimePct }
  }, [orders])

  const filtered = useMemo(() => {
    let list = [...orders]
    if (activeKpi === 'DRAFT') list = list.filter(o => o.status === 'DRAFT')
    else if (activeKpi === 'RELEASED') list = list.filter(o => o.status === 'RELEASED')
    else if (activeKpi === 'IN_PROGRESS') list = list.filter(o => o.status === 'IN_PROGRESS')
    else if (activeKpi === 'COMPLETED') list = list.filter(o => o.status === 'COMPLETED')
    else if (activeKpi === 'OVERDUE') list = list.filter(o => o.endDate && new Date(o.endDate) < new Date() && o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
    if (filterType !== 'ALL') list = list.filter(o => o.type === filterType)
    if (filterPriority !== 'ALL') list = list.filter(o => o.priority === filterPriority)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(o =>
        (o.number || '').toLowerCase().includes(s) ||
        (o.productName || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''
      const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [orders, activeKpi, filterType, filterPriority, search, sortBy, sortDir])

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(o => o.id)))
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Work Orders</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Factory className="w-7 h-7 text-purple-500" /> Work Orders
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Production planning · Execution · Tracking</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40">
            <Plus className="w-5 h-5" /> Create Work Order
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-purple-300' : '')}>
            <Package className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('DRAFT')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg ' + (activeKpi === 'DRAFT' ? 'ring-4 ring-amber-300' : '')}>
            <FileEdit className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.draft}</p><p className="text-xs opacity-90">Draft</p>
          </button>
          <button onClick={() => setActiveKpi('RELEASED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-cyan-800 text-white shadow-lg ' + (activeKpi === 'RELEASED' ? 'ring-4 ring-blue-300' : '')}>
            <PlayCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.released}</p><p className="text-xs opacity-90">Released</p>
          </button>
          <button onClick={() => setActiveKpi('IN_PROGRESS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg ' + (activeKpi === 'IN_PROGRESS' ? 'ring-4 ring-yellow-300' : '')}>
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inProg}</p><p className="text-xs opacity-90">In Progress</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg ' + (activeKpi === 'OVERDUE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue}</p><p className="text-xs opacity-90">Overdue</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.onTimePct}%</p><p className="text-xs opacity-90">On-Time</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by WO # or product..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p === 'ALL' ? 'All Priorities' : p}</option>)}
            </select>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="px-3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">
                Delete {selected.size}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No work orders match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[
                      ['number', 'Number'], ['productName', 'Product'], ['type', 'Type'], ['quantity', 'Qty'],
                      ['status', 'Status'], ['priority', 'Priority'], ['endDate', 'Due'],
                    ].map(([f, label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Progress</th>
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const pct = o.quantity > 0 ? Math.round((Number(o.completedQty || 0) / Number(o.quantity)) * 100) : 0
                    const overdue = o.endDate && new Date(o.endDate) < new Date() && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
                    return (
                      <tr key={o.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                        <td className="p-3 font-mono text-white">{o.number}</td>
                        <td className="p-3 text-neutral-200">
                          <button onClick={() => openDetail(o.id)} className="hover:text-purple-400 inline-flex items-center gap-1">
                            {o.productName || '—'} <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="p-3 text-neutral-400 text-xs">{o.type || 'MANUFACTURING'}</td>
                        <td className="p-3 text-right font-bold text-white">{Number(o.quantity).toFixed(0)}</td>
                        <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusColor(o.status)}>{o.status}</span></td>
                        <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + priorityColor(o.priority)}>{o.priority || 'MEDIUM'}</span></td>
                        <td className={'p-3 text-xs ' + (overdue ? 'text-red-400 font-bold' : 'text-neutral-400')}>
                          {o.endDate ? new Date(o.endDate).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="p-3 w-32">
                          <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1">{pct}% ({o.completedQty || 0}/{o.quantity})</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            {o.status === 'DRAFT' && (
                              <button onClick={() => patchOrder(o.id, { status: 'RELEASED' }, 'Released ' + o.number)} disabled={busy === o.id} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="Release">
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                            {o.status !== 'COMPLETED' && o.status !== 'DRAFT' && (
                              <button onClick={() => patchOrder(o.id, { status: 'COMPLETED', completedQty: o.quantity }, 'Completed ' + o.number)} disabled={busy === o.id} className="p-1.5 rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800" title="Complete">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => downloadPdf(o.id)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => deleteOrder(o.id, o.number)} disabled={deleting === o.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                              {deleting === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <form onSubmit={createOrder} onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> New Work Order</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Product *</label>
                <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">— Select product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.sku ? '(' + p.sku + ')' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Quantity *</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. 100" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="ASSEMBLY">Assembly</option>
                  <option value="PACKAGING">Packaging</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Work Center</label>
                <select value={form.workCenterId} onChange={e => setForm({ ...form, workCenterId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">— None —</option>
                  {workCenters.map(w => <option key={w.id} value={w.id}>{w.name} {w.code ? '(' + w.code + ')' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">BOM</label>
                <select value={form.bomId} onChange={e => setForm({ ...form, bomId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">— None —</option>
                  {boms.map(b => <option key={b.id} value={b.id}>{b.name || b.id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Due Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Production notes, special instructions..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">Create Work Order</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Work Order Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Number', detail.workOrder?.number],
                  ['Product', detail.workOrder?.productName],
                  ['SKU', detail.workOrder?.productSku],
                  ['Type', detail.workOrder?.type],
                  ['Status', detail.workOrder?.status],
                  ['Priority', detail.workOrder?.priority],
                  ['Quantity', detail.workOrder?.quantity],
                  ['Completed', detail.workOrder?.completedQty],
                  ['Work Center', detail.workOrder?.workCenterName],
                  ['BOM', detail.workOrder?.bomName],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.components && detail.components.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-2">BOM Components</h3>
                  <div className="space-y-2">
                    {detail.components.map((c: any, i: number) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3 flex justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{c.componentName}</div>
                          <div className="text-xs text-neutral-400">{c.componentSku} · {c.operation || 'No op'}</div>
                        </div>
                        <div className="text-sm text-white">{Number(c.quantity).toFixed(2)} {c.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => downloadPdf(detail.workOrder.id)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Work Order PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}