'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Star, Shield, TrendingUp, Building2, Mail, Phone, Tag, ChevronRight,
  Filter, ArrowLeft, RefreshCw, Ban, CheckSquare, Square, Check,
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  legalName?: string
  email?: string
  phone?: string
  category?: string
  status?: string
  country?: string
  currency?: string
  riskLevel?: string
  riskScore?: number
  rating?: number
  isPreferred?: boolean
  isBlacklisted?: boolean
  createdAt: string
}

const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']
const CATEGORIES = ['General', 'IT', 'Logistics', 'Manufacturing', 'Services', 'Raw Materials', 'Office', 'Other']
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filters
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [form, setForm] = useState({
    name: '', legalName: '', email: '', phone: '',
    category: 'General', country: 'KE', currency: 'KES',
    taxPin: '', paymentTerms: 30, notes: '',
  })

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      params.set('limit', String(limit))
      params.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/suppliers?' + params.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      let list: Supplier[] = data.suppliers || []
      if (riskFilter) list = list.filter(s => (s.riskLevel || 'LOW') === riskFilter)
      setSuppliers(list)
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSuppliers() /* eslint-disable-next-line */ }, [q, statusFilter, categoryFilter, riskFilter, offset])

  // Clear selection when suppliers list changes (filters/pagination)
  useEffect(() => { setSelectedIds(new Set()) /* eslint-disable-next-line */ }, [q, statusFilter, categoryFilter, riskFilter, offset])

  const createSupplier = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Supplier created')
      setShowCreate(false)
      setForm({ name: '', legalName: '', email: '', phone: '', category: 'General', country: 'KE', currency: 'KES', taxPin: '', paymentTerms: 30, notes: '' })
      fetchSuppliers()
    } finally { setCreating(false) }
  }

  const riskColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-900/50 text-red-300'
      case 'HIGH': return 'bg-orange-900/50 text-orange-300'
      case 'MEDIUM': return 'bg-amber-900/50 text-amber-300'
      default: return 'bg-green-900/50 text-green-300'
    }
  }

  const clearFilters = () => {
    setQ(''); setStatusFilter(''); setCategoryFilter(''); setRiskFilter(''); setOffset(0)
  }

  // ---- Selection helpers ----
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === suppliers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(suppliers.map(s => s.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  // ---- Bulk API call ----
  const runBulk = async (action: 'ACTIVATE' | 'DEACTIVATE' | 'PREFER' | 'UNPREFER') => {
    if (selectedIds.size === 0) return
    const verb = action === 'ACTIVATE' ? 'Activate' : action === 'DEACTIVATE' ? 'Deactivate' : action === 'PREFER' ? 'Mark as preferred' : 'Unmark preferred'
    if (!confirm(verb + ' ' + selectedIds.size + ' supplier(s)?')) return

    setBulkWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/suppliers/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bulk action failed'); return }
      flash(verb + ' ' + data.updated + ' supplier(s)')
      clearSelection()
      fetchSuppliers()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setBulkWorking(false)
    }
  }

  // ---- CSV export of selected ----
  const exportSelectedCSV = () => {
    if (selectedIds.size === 0) return
    const rows = suppliers.filter(s => selectedIds.has(s.id))
    if (rows.length === 0) return
    const headers = ['id', 'name', 'legalName', 'email', 'phone', 'category', 'country', 'currency', 'riskLevel', 'riskScore', 'status', 'isPreferred', 'isBlacklisted', 'createdAt']
    const csvLines = [headers.join(',')]
    for (const r of rows) {
      csvLines.push(headers.map(h => {
        const v = (r as any)[h]
        if (v === null || v === undefined) return ''
        const s = String(v).replace(/"/g, '""')
        return /[",\n]/.test(s) ? '"' + s + '"' : s
      }).join(','))
    }
    const csv = csvLines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'suppliers-' + new Date().toISOString().slice(0,10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
    flash('Exported ' + rows.length + ' supplier(s)')
  }

  const activeFilters = [statusFilter, categoryFilter, riskFilter].filter(Boolean).length + (q ? 1 : 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Suppliers</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Users className="w-8 h-8" /> Suppliers
              </h1>
              <p className="text-white/80 text-sm">360° supplier management · {total} in directory</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="px-5 py-3 rounded-xl bg-white text-indigo-700 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl">
              <Plus className="w-4 h-4" /> New Supplier
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Search + Filters bar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            {suppliers.length > 0 && (
              <button onClick={toggleSelectAll} className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition" title={selectedIds.size === suppliers.length ? 'Deselect all' : 'Select all'}>
                {selectedIds.size === suppliers.length && suppliers.length > 0
                  ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                  : <Square className="w-4 h-4 text-neutral-400" />}
              </button>
            )}
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setOffset(0) }}
                placeholder="Search by name, tax PIN, email…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchSuppliers} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All risk levels</option>
                {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Suppliers list */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No suppliers match your filters' : 'No suppliers yet'}</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Supplier
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {suppliers.map(s => {
                const isSelected = selectedIds.has(s.id)
                return (
                <div
                  key={s.id}
                  className={'relative block bg-white dark:bg-neutral-900 rounded-2xl border p-5 hover:border-indigo-500 hover:shadow-lg transition group ' + (isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-neutral-200 dark:border-neutral-800')}
                >
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(s.id) }}
                    className="absolute top-4 right-4 z-10 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title={isSelected ? 'Deselect' : 'Select'}
                  >
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-indigo-500" />
                      : <Square className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />}
                  </button>
                  <Link href={'/wavecore-erp/procurement/suppliers/' + s.id} className="block">
                  <div className="flex justify-between items-start mb-3 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.isPreferred && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      {s.isBlacklisted && <Ban className="w-4 h-4 text-red-500" />}
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' + riskColor(s.riskLevel)}>
                        {s.riskLevel || 'LOW'} risk
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500 transition" />
                  </div>

                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1 truncate">{s.name}</h3>
                  {s.legalName && <p className="text-xs text-neutral-500 truncate mb-2">{s.legalName}</p>}

                  <div className="space-y-1.5 mt-3">
                    {s.email && <div className="flex items-center gap-2 text-xs text-neutral-500"><Mail className="w-3 h-3" />{s.email}</div>}
                    {s.phone && <div className="flex items-center gap-2 text-xs text-neutral-500"><Phone className="w-3 h-3" />{s.phone}</div>}
                    {s.category && <div className="flex items-center gap-2 text-xs text-neutral-500"><Tag className="w-3 h-3" />{s.category}</div>}
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (s.status === 'ACTIVE' ? 'bg-green-900/30 text-green-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500')}>
                      {s.status || 'ACTIVE'}
                    </span>
                    <span className="text-[10px] text-neutral-400">{new Date(s.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  </Link>
                </div>
                )
              })}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex justify-between items-center mt-6 px-2">
                <span className="text-xs text-neutral-500">
                  Showing {offset + 1}–{Math.min(offset + limit, offset + suppliers.length)} of {total}
                </span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Previous</button>
                  <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 dark:bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-3 flex-wrap max-w-[95vw]">
          <div className="flex items-center gap-2 pr-3 border-r border-neutral-700">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-bold text-sm">{selectedIds.size} selected</span>
          </div>

          <button onClick={() => runBulk('ACTIVATE')} disabled={bulkWorking} className="px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
            <Check className="w-3.5 h-3.5" /> Activate
          </button>
          <button onClick={() => runBulk('DEACTIVATE')} disabled={bulkWorking} className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
            <Ban className="w-3.5 h-3.5" /> Deactivate
          </button>
          <button onClick={() => runBulk('PREFER')} disabled={bulkWorking} className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
            <Star className="w-3.5 h-3.5" /> Prefer
          </button>
          <button onClick={() => runBulk('UNPREFER')} disabled={bulkWorking} className="px-3 py-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
            <Star className="w-3.5 h-3.5" /> Unprefer
          </button>
          <button onClick={exportSelectedCSV} disabled={bulkWorking} className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
            <Tag className="w-3.5 h-3.5" /> Export CSV
          </button>

          {bulkWorking && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}

          <button onClick={clearSelection} className="ml-auto p-2 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 text-neutral-400 hover:text-white" title="Clear selection">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Supplier modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> New Supplier</h2>
              <button onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Legal Name</label>
                  <input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Tax PIN</label>
                  <input value={form.taxPin} onChange={e => setForm({ ...form, taxPin: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {['KES', 'USD', 'EUR', 'GBP', 'ZAR', 'UGX', 'TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
              <button onClick={createSupplier} disabled={creating} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}