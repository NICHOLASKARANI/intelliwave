'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Loader2, RefreshCw, Trash2, Edit3, X, Save,
  Calculator, TrendingDown, Package, AlertTriangle, CheckCircle2,
  ChevronRight, Calendar as CalIcon,
} from 'lucide-react'

interface Asset {
  id: string
  code: string
  name: string
  category: string | null
  purchaseDate: string
  purchaseCost: number
  residualValue: number
  usefulLifeMonths: number
  method: 'STRAIGHT_LINE' | 'DECLINING'
  accumulatedDepreciation: number
  lastDepreciatedAt: string | null
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED'
  assetAccountId: string | null
  depreciationExpenseAccountId: string | null
  accumulatedDepreciationAccountId: string | null
  bookValue: number
}

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface ScheduleRow {
  period: number
  date: string
  opening: number
  depreciation: number
  closing: number
  accumulated: number
  posted: boolean
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totals, setTotals] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [working, setWorking] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', category: '', purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: '', residualValue: '', usefulLifeMonths: '60',
    method: 'STRAIGHT_LINE', status: 'ACTIVE',
    assetAccountId: '', depreciationExpenseAccountId: '', accumulatedDepreciationAccountId: '',
  })

  const [scheduleFor, setScheduleFor] = useState<Asset | null>(null)
  const [schedule, setSchedule] = useState<ScheduleRow[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }
  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtShort = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    try {
      const [aRes, cRes] = await Promise.all([
        fetch('/api/wavecore/finance/assets', { cache: 'no-store' }),
        fetch('/api/wavecore/gl/chart-of-accounts', { cache: 'no-store' }),
      ])
      const aData = await aRes.json()
      const cData = await cRes.json()
      setAssets(aData.assets || [])
      setTotals(aData.totals || {})
      setAccounts(cData.accounts || [])
    } catch { setError('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const t = setInterval(() => load({ silent: true }), 30000)
    return () => clearInterval(t)
  }, [])

  const resetForm = () => {
    setFormData({
      name: '', category: '', purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseCost: '', residualValue: '', usefulLifeMonths: '60',
      method: 'STRAIGHT_LINE', status: 'ACTIVE',
      assetAccountId: '', depreciationExpenseAccountId: '', accumulatedDepreciationAccountId: '',
    })
    setEditingId(null)
  }

  const openEdit = (a: Asset) => {
    setFormData({
      name: a.name, category: a.category || '',
      purchaseDate: new Date(a.purchaseDate).toISOString().slice(0, 10),
      purchaseCost: String(a.purchaseCost), residualValue: String(a.residualValue),
      usefulLifeMonths: String(a.usefulLifeMonths),
      method: a.method, status: a.status,
      assetAccountId: a.assetAccountId || '',
      depreciationExpenseAccountId: a.depreciationExpenseAccountId || '',
      accumulatedDepreciationAccountId: a.accumulatedDepreciationAccountId || '',
    })
    setEditingId(a.id)
    setShowForm(true)
  }

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWorking('form')
    try {
      const payload: any = {
        name: formData.name,
        category: formData.category || null,
        purchaseDate: formData.purchaseDate,
        purchaseCost: Number(formData.purchaseCost),
        residualValue: Number(formData.residualValue || 0),
        usefulLifeMonths: Number(formData.usefulLifeMonths),
        method: formData.method,
        assetAccountId: formData.assetAccountId || null,
        depreciationExpenseAccountId: formData.depreciationExpenseAccountId || null,
        accumulatedDepreciationAccountId: formData.accumulatedDepreciationAccountId || null,
      }
      if (editingId) {
        payload.status = formData.status
        const res = await fetch('/api/wavecore/finance/assets/' + editingId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Save failed'); return }
        flash('Asset updated')
      } else {
        const res = await fetch('/api/wavecore/finance/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Create failed'); return }
        flash('Asset created: ' + data.asset.code)
      }
      resetForm()
      setShowForm(false)
      load()
    } catch (e) { setError('Network error: ' + (e as Error).message) }
    finally { setWorking('') }
  }

  const removeAsset = async (a: Asset) => {
    if (!confirm('Delete ' + a.code + ' ' + a.name + '?')) return
    setWorking('del-' + a.id)
    try {
      const res = await fetch('/api/wavecore/finance/assets/' + a.id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Delete failed'); return }
      flash('Asset deleted')
      load()
    } catch { setError('Network error') }
    finally { setWorking('') }
  }

  const openSchedule = async (a: Asset) => {
    setScheduleFor(a)
    setScheduleLoading(true)
    try {
      const res = await fetch('/api/wavecore/finance/assets/' + a.id + '/schedule', { cache: 'no-store' })
      const data = await res.json()
      setSchedule(data.schedule || [])
    } catch { setError('Failed to load schedule') }
    finally { setScheduleLoading(false) }
  }

  const depreciateOne = async (a: Asset) => {
    if (!confirm('Post this month\'s depreciation for ' + a.code + '?')) return
    setWorking('dep-' + a.id)
    try {
      const res = await fetch('/api/wavecore/finance/assets/' + a.id + '/depreciate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Depreciation failed'); return }
      flash('Posted ' + data.entry.number + ' — ' + fmt(data.entry.amount))
      load()
      if (scheduleFor?.id === a.id) openSchedule(a)
    } catch { setError('Network error') }
    finally { setWorking('') }
  }

  const depreciateAll = async () => {
    if (!confirm('Post this month\'s depreciation for every active asset with accounts set?')) return
    setWorking('batch')
    try {
      const res = await fetch('/api/wavecore/finance/assets/depreciate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Batch failed'); return }
      flash('Posted ' + data.entry.number + ' for ' + data.posted + ' asset(s) — ' + fmt(data.entry.amount))
      load()
    } catch { setError('Network error') }
    finally { setWorking('') }
  }

  const accountOptions = useMemo(() => accounts, [accounts])
  const assetAccts = accountOptions.filter(a => String(a.type).toUpperCase() === 'ASSET')
  const expenseAccts = accountOptions.filter(a => String(a.type).toUpperCase() === 'EXPENSE')

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/finance" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold">Fixed Assets</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={depreciateAll} disabled={working === 'batch' || assets.length === 0} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              {working === 'batch' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Run depreciation
            </button>
            <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Asset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Fixed Assets & Depreciation</h1>
          <p className="text-sm text-neutral-500 mt-1">Asset register, depreciation schedule, and monthly posting.</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Package className="w-5 h-5 text-teal-500 mb-2" />
            <p className="text-lg font-bold">{totals.count || 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Assets</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <p className="text-lg font-bold">{fmtShort(totals.cost || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Total cost</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <TrendingDown className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-lg font-bold">{fmtShort(totals.accumulated || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Accumulated dep.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <p className="text-lg font-bold text-green-600">{fmtShort(totals.bookValue || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Net book value</p>
          </div>
        </div>

        {showForm && (
          <form onSubmit={submitForm} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">{editingId ? 'Edit asset' : 'New asset'}</h3>
              <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Vehicle, Furniture…" className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Purchase date *</label>
                <input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Purchase cost *</label>
                <input type="number" step="0.01" min="0" value={formData.purchaseCost} onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Residual value</label>
                <input type="number" step="0.01" min="0" value={formData.residualValue} onChange={e => setFormData({ ...formData, residualValue: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Useful life (months) *</label>
                <input type="number" min="1" max="600" value={formData.usefulLifeMonths} onChange={e => setFormData({ ...formData, usefulLifeMonths: e.target.value })} required className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Method</label>
                <select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  <option value="STRAIGHT_LINE">Straight line</option>
                  <option value="DECLINING">Declining balance (2×)</option>
                </select>
              </div>
              {editingId && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    <option value="ACTIVE">Active</option>
                    <option value="DISPOSED">Disposed</option>
                    <option value="FULLY_DEPRECIATED">Fully depreciated</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Asset account</label>
                <select value={formData.assetAccountId} onChange={e => setFormData({ ...formData, assetAccountId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  <option value="">— none —</option>
                  {assetAccts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Depreciation expense account</label>
                <select value={formData.depreciationExpenseAccountId} onChange={e => setFormData({ ...formData, depreciationExpenseAccountId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  <option value="">— none —</option>
                  {expenseAccts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Accumulated depreciation account</label>
                <select value={formData.accumulatedDepreciationAccountId} onChange={e => setFormData({ ...formData, accumulatedDepreciationAccountId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  <option value="">— none —</option>
                  {assetAccts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">Cancel</button>
              <button type="submit" disabled={working === 'form'} className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40">
                {working === 'form' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No assets yet</p>
            <p className="text-sm text-neutral-500 mt-1">Add your first fixed asset to start tracking depreciation.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Purchased</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Accum.</th>
                    <th className="px-4 py-3 text-right">Book value</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{a.code}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium">{a.name}</p>
                        <p className="text-[10px] text-neutral-500">{a.usefulLifeMonths}mo · {a.method === 'DECLINING' ? 'declining' : 'straight line'}</p>
                      </td>
                      <td className="px-4 py-2 text-xs text-neutral-500">{a.category || '—'}</td>
                      <td className="px-4 py-2 text-xs text-neutral-500">{new Date(a.purchaseDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-2 text-right">{fmt(a.purchaseCost)}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{fmt(a.accumulatedDepreciation)}</td>
                      <td className="px-4 py-2 text-right font-bold text-green-600">{fmt(a.bookValue)}</td>
                      <td className="px-4 py-2">
                        <span className={'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ' +
                          (a.status === 'ACTIVE' ? 'bg-green-900/40 text-green-300' :
                           a.status === 'FULLY_DEPRECIATED' ? 'bg-blue-900/40 text-blue-300' :
                           'bg-neutral-700 text-neutral-300')}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openSchedule(a)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-teal-600" title="View schedule">
                            <CalIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => depreciateOne(a)} disabled={a.status !== 'ACTIVE' || working === 'dep-' + a.id} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-amber-600 disabled:opacity-30" title="Post this month">
                            {working === 'dep-' + a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-blue-600" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeAsset(a)} disabled={working === 'del-' + a.id} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-600 disabled:opacity-30" title="Delete">
                            {working === 'del-' + a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

        {/* Schedule drawer */}
        {scheduleFor && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setScheduleFor(null)}>
            <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{scheduleFor.code} · {scheduleFor.name}</h3>
                  <p className="text-xs text-neutral-500">{scheduleFor.usefulLifeMonths}-month {scheduleFor.method === 'DECLINING' ? 'declining balance' : 'straight line'} schedule</p>
                </div>
                <button onClick={() => setScheduleFor(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {scheduleLoading ? (
                  <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50 sticky top-0">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Period</th>
                        <th className="px-4 py-2 text-right">Opening</th>
                        <th className="px-4 py-2 text-right">Charge</th>
                        <th className="px-4 py-2 text-right">Closing</th>
                        <th className="px-4 py-2 text-right">Accum.</th>
                        <th className="px-4 py-2 text-center">Posted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map(r => (
                        <tr key={r.period} className={'border-t border-neutral-100 dark:border-neutral-800 ' + (r.posted ? 'bg-green-950/10' : '')}>
                          <td className="px-4 py-2 text-xs text-neutral-500">{r.period}</td>
                          <td className="px-4 py-2 text-xs">{new Date(r.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-2 text-right text-xs">{fmt(r.opening)}</td>
                          <td className="px-4 py-2 text-right font-medium">{fmt(r.depreciation)}</td>
                          <td className="px-4 py-2 text-right text-xs">{fmt(r.closing)}</td>
                          <td className="px-4 py-2 text-right text-xs">{fmt(r.accumulated)}</td>
                          <td className="px-4 py-2 text-center">
                            {r.posted ? <CheckCircle2 className="w-4 h-4 text-green-500 inline" /> : <span className="text-[10px] text-neutral-500">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/30">
                <p className="text-xs text-neutral-500">
                  {schedule.filter(r => r.posted).length} of {schedule.length} periods posted
                </p>
                <button
                  onClick={() => depreciateOne(scheduleFor)}
                  disabled={scheduleFor.status !== 'ACTIVE' || working === 'dep-' + scheduleFor.id || schedule.every(r => r.posted)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  {working === 'dep-' + scheduleFor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  Post next period
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}