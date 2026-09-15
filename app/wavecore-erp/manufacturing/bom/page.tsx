'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Layers, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Package, Activity, TrendingUp, FileEdit, Copy,
  ChevronRight, Sparkles, DollarSign, AlertTriangle, Boxes,
} from 'lucide-react'

const statusColor = (active: boolean) =>
  active ? 'bg-green-900/40 text-green-300 border border-green-700'
         : 'bg-red-900/40 text-red-300 border border-red-700'

export default function BOMPage() {
  const [boms, setBoms] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [cloning, setCloning] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    name: '', code: '', productId: '', quantity: '1', isActive: true,
    components: [{ productId: '', quantity: '', unit: 'pcs', scrapRate: '', operation: '' }] as any[],
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [b, p] = await Promise.all([
        fetch('/api/wavecore/manufacturing/bom').then(r => r.json()).catch(() => ({ boms: [] })),
        fetch('/api/wavecore/inventory/products').then(r => r.json()).catch(() => ({ products: [] })),
      ])
      setBoms(b.boms || [])
      setProducts(p.products || [])
    } catch { setError('Failed to load BOMs') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const resetForm = () => setForm({
    name: '', code: '', productId: '', quantity: '1', isActive: true,
    components: [{ productId: '', quantity: '', unit: 'pcs', scrapRate: '', operation: '' }],
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/bom/' + id)
    const data = await res.json()
    if (!data.bom) return
    setForm({
      name: data.bom.name || '',
      code: data.bom.code || '',
      productId: data.bom.productId || '',
      quantity: String(data.bom.quantity || 1),
      isActive: !!data.bom.isActive,
      components: (data.components || []).map((c: any) => ({
        productId: c.productId, quantity: String(c.quantity), unit: c.unit || 'pcs',
        scrapRate: String(c.scrapRate || ''), operation: c.operation || '',
      })),
    })
    setEditing(data.bom)
    setShowCreate(true)
  }

  const addRow = () => setForm({
    ...form,
    components: [...form.components, { productId: '', quantity: '', unit: 'pcs', scrapRate: '', operation: '' }],
  })
  const removeRow = (i: number) => setForm({
    ...form,
    components: form.components.filter((_, idx) => idx !== i),
  })
  const updateRow = (i: number, key: string, val: string) => {
    const copy = [...form.components]
    copy[i] = { ...copy[i], [key]: val }
    setForm({ ...form, components: copy })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('BOM name is required'); return }
    if (!form.productId) { setError('Product is required'); return }
    if (form.components.length === 0) { setError('Add at least one component'); return }
    for (const c of form.components) {
      if (!c.productId) { setError('Every component needs a product'); return }
      if (!c.quantity || Number(c.quantity) <= 0) { setError('Component quantities must be > 0'); return }
    }

    const payload = {
      ...form,
      quantity: Number(form.quantity || 1),
      components: form.components.map(c => ({
        ...c, quantity: Number(c.quantity), scrapRate: Number(c.scrapRate || 0),
      })),
    }

    try {
      const url = editing
        ? '/api/wavecore/manufacturing/bom/' + editing.id
        : '/api/wavecore/manufacturing/bom'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'BOM updated' : 'BOM created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete BOM ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/bom/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const clone = async (id: string, name: string) => {
    if (!confirm('Clone BOM ' + name + '?')) return
    setCloning(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/bom/' + id, { method: 'POST' })
      if (res.ok) { flash('Cloned'); fetchAll() }
    } finally { setCloning('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' BOM(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/bom/' + id, { method: 'DELETE' })
    }
    setSelected(new Set()); flash('Bulk delete complete'); fetchAll()
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/bom/' + id)
    const data = await res.json()
    setDetail(data)
  }

  const pdf = (id: string) => window.open('/api/wavecore/manufacturing/bom/' + id + '/pdf', '_blank')

  const summary = useMemo(() => {
    const total = boms.length
    const active = boms.filter(b => b.isActive).length
    const inactive = total - active
    const withComponents = boms.filter(b => Number(b.componentCount) > 0).length
    const totalComponents = boms.reduce((s, b) => s + Number(b.componentCount || 0), 0)
    const avgComponents = total > 0 ? Math.round(totalComponents / total) : 0
    const avgCost = total > 0 ? Math.round(boms.reduce((s, b) => s + Number(b.totalCost || 0), 0) / total) : 0
    const totalValue = Math.round(boms.reduce((s, b) => s + Number(b.totalCost || 0), 0))
    return { total, active, inactive, withComponents, totalComponents, avgComponents, avgCost, totalValue }
  }, [boms])

  const filtered = useMemo(() => {
    let list = [...boms]
    if (activeKpi === 'ACTIVE') list = list.filter(b => b.isActive)
    else if (activeKpi === 'INACTIVE') list = list.filter(b => !b.isActive)
    else if (activeKpi === 'WITH') list = list.filter(b => Number(b.componentCount) > 0)
    else if (activeKpi === 'EMPTY') list = list.filter(b => Number(b.componentCount) === 0)
    if (filterActive === 'YES') list = list.filter(b => b.isActive)
    if (filterActive === 'NO') list = list.filter(b => !b.isActive)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(b =>
        (b.name || '').toLowerCase().includes(s) ||
        (b.code || '').toLowerCase().includes(s) ||
        (b.productName || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [boms, activeKpi, filterActive, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">Manufacturing · Bill of Materials</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Layers className="w-7 h-7 text-purple-500" /> Bill of Materials
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Component structures · Costing · Multi-level</p>
          </div>
          <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40">
            <Plus className="w-5 h-5" /> Create BOM
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-purple-300' : '')}>
            <Layers className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('ACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'ACTIVE' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active}</p><p className="text-xs opacity-90">Active</p>
          </button>
          <button onClick={() => setActiveKpi('INACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg ' + (activeKpi === 'INACTIVE' ? 'ring-4 ring-red-300' : '')}>
            <FileEdit className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inactive}</p><p className="text-xs opacity-90">Inactive</p>
          </button>
          <button onClick={() => setActiveKpi('WITH')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-cyan-800 text-white shadow-lg ' + (activeKpi === 'WITH' ? 'ring-4 ring-blue-300' : '')}>
            <Package className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.withComponents}</p><p className="text-xs opacity-90">With Components</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <Boxes className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalComponents}</p><p className="text-xs opacity-90">Components</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white shadow-lg">
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgComponents}</p><p className="text-xs opacity-90">Avg / BOM</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalValue.toLocaleString()}</p><p className="text-xs opacity-90">Total Value</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code or product..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Status</option>
              <option value="YES">Active only</option>
              <option value="NO">Inactive only</option>
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
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No BOMs match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[['name','Name'],['code','Code'],['productName','Product'],['componentCount','Components'],['totalCost','Cost'],['isActive','Status'],['updatedAt','Updated']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3"><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                      <td className="p-3 text-white">
                        <button onClick={() => openDetail(b.id)} className="hover:text-purple-400 inline-flex items-center gap-1 font-medium">
                          {b.name} <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-3 font-mono text-xs text-neutral-400">{b.code || '—'}</td>
                      <td className="p-3 text-neutral-200">{b.productName || '—'}</td>
                      <td className="p-3 text-right text-white font-bold">{Number(b.componentCount || 0)}</td>
                      <td className="p-3 text-right text-purple-300 font-bold">{Number(b.totalCost || 0).toFixed(2)}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusColor(b.isActive)}>{b.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                      <td className="p-3 text-xs text-neutral-400">{b.updatedAt ? new Date(b.updatedAt).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => pdf(b.id)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(b.id)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => clone(b.id, b.name)} disabled={cloning === b.id} className="p-1.5 rounded-lg bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800" title="Clone">
                            {cloning === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => del(b.id, b.name)} disabled={deleting === b.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                            {deleting === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> {editing ? 'Edit BOM' : 'New BOM'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">BOM Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Laptop Assembly BOM" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="auto if blank" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Product *</label>
                <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">— Select product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.sku ? '(' + p.sku + ')' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Output Qty *</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-3">
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>

            <div className="px-6 pb-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide">Components *</h3>
                <button type="button" onClick={addRow} className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 font-bold">+ Add Row</button>
              </div>
              <div className="space-y-2">
                {form.components.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <select value={c.productId} onChange={e => updateRow(i, 'productId', e.target.value)} className="col-span-4 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">
                      <option value="">— Component —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="Qty" value={c.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <input placeholder="Unit" value={c.unit} onChange={e => updateRow(i, 'unit', e.target.value)} className="col-span-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <input type="number" step="0.1" placeholder="Scrap %" value={c.scrapRate} onChange={e => updateRow(i, 'scrapRate', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <input placeholder="Operation" value={c.operation} onChange={e => updateRow(i, 'operation', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
                    <button type="button" onClick={() => removeRow(i)} disabled={form.components.length === 1} className="col-span-1 p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-30">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800 mt-4">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">{editing ? 'Save Changes' : 'Create BOM'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">BOM Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[['Name', detail.bom?.name],['Code', detail.bom?.code],['Product', detail.bom?.productName],['SKU', detail.bom?.productSku],['Output Qty', detail.bom?.quantity],['Status', detail.bom?.isActive ? 'ACTIVE' : 'INACTIVE']].map(([k,v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.components && detail.components.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-2">Components ({detail.components.length})</h3>
                  <div className="space-y-2">
                    {detail.components.map((c: any, i: number) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-white">{c.componentName}</div>
                          <div className="text-xs text-neutral-400">{c.componentSku} · {c.operation || 'no operation'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">{Number(c.quantity).toFixed(2)} {c.unit}</div>
                          <div className="text-xs text-purple-300">${Number(c.extendedCost || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-purple-900/30 border border-purple-800 flex justify-between items-center">
                    <span className="text-xs uppercase text-purple-300 font-bold">Total Material Cost</span>
                    <span className="text-lg font-bold text-white">${Number(detail.totalCost || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <button onClick={() => pdf(detail.bom.id)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print BOM PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}