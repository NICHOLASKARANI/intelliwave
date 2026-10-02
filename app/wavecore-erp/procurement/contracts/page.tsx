'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileSignature, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, ClipboardList, Package, Users,
  ChevronLeft, ChevronRight, Save, Calendar, DollarSign, AlertCircle,
  Layers, Sparkles, Clock, FileText, Landmark, ArrowRight, Trash2,
} from 'lucide-react'

interface Contract {
  id: string
  contractNumber: string
  title: string
  supplierId?: string
  supplierName?: string
  type: string
  startDate?: string
  endDate?: string
  value: number
  currency: string
  paymentTerms: number
  status: string
  autoRenew: boolean
  renewalNoticeDays: number
  signedAt?: string
  signedByName?: string
  notes?: string
  createdAt: string
  linesCount: number
  milestonesCount: number
}

interface Supplier {
  id: string
  name: string
  legalName?: string
}

interface DraftLine {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  unitOfMeasure: string
}

interface DraftMilestone {
  name: string
  dueDate: string
  amount: number
}

const CONTRACT_TYPES = ['SERVICE','GOODS','MAINTENANCE','NDA','MSA','LEASE','OTHER']
const CONTRACT_STATUSES = ['DRAFT','ACTIVE','SUSPENDED','EXPIRED','TERMINATED']
const UOM = ['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY','MONTH']

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', ACTIVE: 'Active', SUSPENDED: 'Suspended',
  EXPIRED: 'Expired', TERMINATED: 'Terminated',
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [showWizard, setShowWizard] = useState(false)

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  // ---- Table sorting ----
  const [sortBy, setSortBy] = useState<'createdAt'|'contractNumber'|'status'|'endDate'|'value'|'type'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortBy(key as any); setSortDir("desc") }
  }

  const sortedContracts = [...contracts].sort((a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1
    const val = (x: any) => {
      if (sortBy === "createdAt") return new Date(x.createdAt).getTime()
      if (sortBy === "endDate") return x.endDate ? new Date(x.endDate).getTime() : 0
      if (sortBy === "value") return Number(x.value || 0)
      return String(x[sortBy] || "").toLowerCase()
    }
    const av = val(a); const bv = val(b)
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })

  const fetchContracts = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      if (typeFilter) p.set('type', typeFilter)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/contracts?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setContracts(data.contracts || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchContracts() /* eslint-disable-next-line */ }, [q, statusFilter, typeFilter, offset])
  const deleteContract = async (id: string, contractNumber: string) => {
    if (!confirm('Delete contract ' + contractNumber + '? This cannot be undone.')) return
    try {
      const res = await fetch('/api/wavecore/procurement/contracts/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '') },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Delete failed'); return }
      flash('Contract deleted')
      fetchContracts()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    }
  }

  // 30-second silent auto-refresh
  useEffect(() => {
    const t = setInterval(() => { fetchContracts({ silent: true }) }, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [q, statusFilter, typeFilter, offset])

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-300'
      case 'ACTIVE': return 'bg-green-900/50 text-green-300'
      case 'SUSPENDED': return 'bg-amber-900/50 text-amber-300'
      case 'EXPIRED': return 'bg-orange-900/50 text-orange-300'
      case 'TERMINATED': return 'bg-red-900/50 text-red-300'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const clearFilters = () => { setQ(''); setStatusFilter(''); setTypeFilter(''); setOffset(0) }
  const activeFilters = [statusFilter, typeFilter].filter(Boolean).length + (q ? 1 : 0)

  const daysToExpiry = (end?: string) => {
    if (!end) return null
    const diff = Math.floor((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const drafts = contracts.filter(c => c.status === 'DRAFT').length
  const active = contracts.filter(c => c.status === 'ACTIVE').length
  const expiring = contracts.filter(c => {
    if (c.status !== 'ACTIVE') return false
    const d = daysToExpiry(c.endDate)
    return d != null && d <= 60 && d >= 0
  }).length
  const totalValue = contracts.reduce((s, c) => s + Number(c.value || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Contracts</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <FileSignature className="w-8 h-8" /> Contracts
              </h1>
              <p className="text-white/80 text-sm">Supplier agreements · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/orders" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> POs
              </Link>
              <Link href="/wavecore-erp/procurement/rfqs" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> RFQs
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-blue-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New Contract
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={FileText} label="Active" value={active} color="text-green-500" onClick={() => { setStatusFilter('ACTIVE'); setOffset(0) }} />
          <Kpi icon={Sparkles} label="Drafts" value={drafts} color="text-neutral-500" onClick={() => { setStatusFilter('DRAFT'); setOffset(0) }} />
          <Kpi icon={AlertCircle} label="Expiring ≤60d" value={expiring} color="text-amber-500" onClick={() => { setStatusFilter('ACTIVE'); setOffset(0) }} />
          <Kpi icon={Landmark} label="Total value" value={'KES ' + totalValue.toLocaleString()} color="text-blue-500" small />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search contract number, title, supplier…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={() => fetchContracts()} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
              </select>
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All types</option>
                {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <FileSignature className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No contracts match your filters' : 'No contracts yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Contract
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('contractNumber')}>Contract#</th>
                    <th className="px-4 py-3">Title / Supplier</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('type')}>Type</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('status')}>Status</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3 text-right cursor-pointer hover:text-blue-600" onClick={() => toggleSort('value')}>Value</th>
                    <th className="px-4 py-3 text-right">Lines / Ms</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('endDate')}>Expiry</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContracts.map((c: any) => {
                    const d = daysToExpiry(c.endDate)
                    const warning = c.status === 'ACTIVE' && d != null && d >= 0 && d <= 60
                    const expiryClass = d == null ? '' : d < 0 ? 'text-red-500 font-bold' : d <= 60 ? 'text-amber-500 font-bold' : 'text-neutral-500'
                    const expiryLabel = d == null ? '—' : d < 0 ? 'expired ' + Math.abs(d) + 'd ago' : 'in ' + d + 'd'
                    return (
                      <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                        <td className="px-4 py-3 align-top">
                          <Link href={'/wavecore-erp/procurement/contracts/' + c.id} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            {c.contractNumber}
                          </Link>
                          {c.autoRenew && <p className="text-[10px] text-cyan-500 mt-0.5">auto-renew</p>}
                        </td>
                        <td className="px-4 py-3 align-top max-w-[260px]">
                          <Link href={'/wavecore-erp/procurement/contracts/' + c.id} className="block">
                            <p className="font-medium text-neutral-900 dark:text-white truncate text-xs">{c.title}</p>
                            {c.supplierName && <p className="text-[10px] text-neutral-500 truncate">{c.supplierName}</p>}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{c.type}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(c.status)}>{STATUS_LABELS[c.status] || c.status}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-[11px] text-neutral-500">
                          {c.startDate && <p>from {new Date(c.startDate).toLocaleDateString('en-GB')}</p>}
                          {c.endDate && <p>to {new Date(c.endDate).toLocaleDateString('en-GB')}</p>}
                          {!c.startDate && !c.endDate && '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <p className="font-bold text-neutral-900 dark:text-white">{c.currency} {Number(c.value || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-right text-xs text-neutral-500">
                          {c.linesCount} / {c.milestonesCount}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={'text-[11px] ' + expiryClass}>{expiryLabel}</span>
                          {warning && <p className="text-[10px] text-amber-500 mt-0.5">expiring soon</p>}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Link href={'/wavecore-erp/procurement/contracts/' + c.id} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-900/20" title="Open">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteContract(c.id, c.contractNumber) }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/20" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + contracts.length)} of {total}</span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Previous</button>
                  <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showWizard && (
        <ContractWizard onClose={() => setShowWizard(false)} onCreated={() => { setShowWizard(false); flash('Contract created'); fetchContracts() }} />
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, color, small, onClick, title }: any) {
  const cls = 'text-left bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 w-full ' +
              (onClick ? 'hover:border-blue-500 transition cursor-pointer' : '')
  const content = (
    <>
      <Icon className={'w-5 h-5 mb-2 ' + color} />
      <p className={'font-bold text-neutral-900 dark:text-white ' + (small ? 'text-lg' : 'text-2xl')}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} title={title || label}>
        {content}
      </button>
    )
  }
  return <div className={cls}>{content}</div>
}

function ContractWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierQuery, setSupplierQuery] = useState('')
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const [form, setForm] = useState({
    title: '',
    type: 'SERVICE',
    currency: 'KES',
    paymentTerms: 30,
    startDate: '',
    endDate: '',
    value: 0,
    autoRenew: false,
    renewalNoticeDays: 30,
    notes: '',
  })

  const [lines, setLines] = useState<DraftLine[]>([])
  const [milestones, setMilestones] = useState<DraftMilestone[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  useEffect(() => {
    if (step !== 1) return
    setLoadingSuppliers(true)
    fetch('/api/wavecore/procurement/suppliers?status=ACTIVE&limit=100')
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoadingSuppliers(false))
  }, [step])

  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<DraftLine>) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const addMilestone = () => setMilestones(prev => [...prev, { name: '', dueDate: '', amount: 0 }])
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i))
  const updateMilestone = (i: number, patch: Partial<DraftMilestone>) => setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m))

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); setStep(1); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        type: form.type,
        supplierId: selectedSupplier?.id,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        value: Number(form.value) || 0,
        currency: form.currency,
        paymentTerms: Number(form.paymentTerms) || 30,
        autoRenew: form.autoRenew,
        renewalNoticeDays: Number(form.renewalNoticeDays) || 30,
        notes: form.notes || undefined,
        lines: lines.filter(l => l.description.trim()).map(l => ({
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
          unitOfMeasure: l.unitOfMeasure,
        })),
        milestones: milestones.filter(m => m.name.trim()).map(m => ({
          name: m.name,
          dueDate: m.dueDate || undefined,
          amount: Number(m.amount) || 0,
        })),
      }

      const res = await fetch('/api/wavecore/procurement/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }
      onCreated()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally { setSaving(false) }
  }

  const filteredSuppliers = suppliers.filter(s =>
    !supplierQuery ||
    s.name.toLowerCase().includes(supplierQuery.toLowerCase()) ||
    (s.legalName || '').toLowerCase().includes(supplierQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-blue-500" /> New Contract
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3].map(n => (
            <div key={n} className={'flex-1 h-1.5 rounded-full ' + (n <= step ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-800')}></div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual IT support agreement" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Supplier</h3>
                {selectedSupplier ? (
                  <div className="p-4 rounded-xl bg-blue-900/10 dark:bg-blue-900/20 border border-blue-500/30 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{selectedSupplier.name}</p>
                      {selectedSupplier.legalName && <p className="text-xs text-neutral-500">{selectedSupplier.legalName}</p>}
                    </div>
                    <button onClick={() => setSelectedSupplier(null)} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="Search supplier…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-2 text-sm" />
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                      {loadingSuppliers ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-blue-500" /></div>
                      : filteredSuppliers.length === 0 ? <p className="p-4 text-center text-sm text-neutral-500">No suppliers found</p>
                      : filteredSuppliers.map(s => (
                        <button key={s.id} onClick={() => setSelectedSupplier(s)} className="w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                          <p className="text-sm font-medium">{s.name}</p>
                          {s.legalName && <p className="text-xs text-neutral-500">{s.legalName}</p>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Start date">
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="End date">
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Contract value">
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} min="0" step="0.01" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Payment terms (days)">
                  <input type="number" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: Number(e.target.value) })} min="0" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-cyan-900/10 dark:bg-cyan-900/20 border border-cyan-800/30 cursor-pointer">
                <input type="checkbox" checked={form.autoRenew} onChange={e => setForm({ ...form, autoRenew: e.target.checked })} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-cyan-900 dark:text-cyan-300">Auto-renew</p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-400">Automatically renew before end date</p>
                </div>
                {form.autoRenew && (
                  <div className="text-right">
                    <input type="number" value={form.renewalNoticeDays} onChange={e => setForm({ ...form, renewalNoticeDays: Number(e.target.value) })} min="1" className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <p className="text-[10px] text-cyan-600 mt-1">days notice</p>
                  </div>
                )}
              </label>

              {/* Lines */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Lines ({lines.length})</h3>
                  <button type="button" onClick={addLine} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add line
                  </button>
                </div>
                {lines.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-2">Optional — add scope items if the contract has specific line items</p>
                ) : lines.map((l, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Line {i + 1}</span>
                      <button type="button" onClick={() => removeLine(i)} className="p-1 rounded text-red-400 hover:bg-red-900/30"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} placeholder="Qty" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <select value={l.unitOfMeasure} onChange={e => updateLine(i, { unitOfMeasure: e.target.value })} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm">
                        {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input type="number" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} placeholder="Unit price" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <input type="number" value={l.taxRate} onChange={e => updateLine(i, { taxRate: Number(e.target.value) })} placeholder="Tax %" min="0" max="100" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Milestones ({milestones.length})</h3>
                  <button type="button" onClick={addMilestone} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add milestone
                  </button>
                </div>
                {milestones.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-2">Optional — track key dates and payments</p>
                ) : milestones.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Milestone {i + 1}</span>
                      <button type="button" onClick={() => removeMilestone(i)} className="p-1 rounded text-red-400 hover:bg-red-900/30"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={m.name} onChange={e => updateMilestone(i, { name: e.target.value })} placeholder="Milestone name" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={m.dueDate} onChange={e => updateMilestone(i, { dueDate: e.target.value })} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <input type="number" value={m.amount} onChange={e => updateMilestone(i, { amount: Number(e.target.value) })} placeholder="Amount" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    </div>
                  </div>
                ))}
              </div>

              <Field label="Notes">
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                <Row label="Title" value={form.title} />
                <Row label="Type" value={form.type} />
                <Row label="Supplier" value={selectedSupplier?.name || '—'} />
                {form.startDate && <Row label="Start" value={form.startDate} />}
                {form.endDate && <Row label="End" value={form.endDate} />}
                <Row label="Value" value={form.currency + ' ' + Number(form.value).toLocaleString()} bold />
                <Row label="Lines" value={String(lines.filter(l => l.description.trim()).length)} />
                <Row label="Milestones" value={String(milestones.filter(m => m.name.trim()).length)} />
                <Row label="Auto-renew" value={form.autoRenew ? 'Yes (' + form.renewalNoticeDays + 'd notice)' : 'No'} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-5 border-t border-neutral-200 dark:border-neutral-800 gap-3">
          <button type="button" onClick={() => step === 1 ? onClose() : setStep(s => s - 1)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-2">
            {step < 3 && (
              <button type="button" onClick={() => {
                if (step === 1 && !form.title.trim()) { setError('Title is required'); return }
                setError('')
                setStep(s => s + 1)
              }} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button type="button" onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Contract
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium'}>{value}</span>
    </div>
  )
}
