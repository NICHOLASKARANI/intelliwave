'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus, Printer, Trash2, Loader2, Wallet, BarChart3, Download, ArrowLeft,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'

interface Budget {
  id: string
  name: string
  fiscalYear: number
  period: string
  amount: number
  accountCode?: string | null
  createdAt: string
}

interface VarianceRow {
  id: string
  name: string
  accountCode: string
  period: string
  budgetAmount: number
  actual: number
  variance: number
  variancePct: number | null
  overBudget: boolean
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'list' | 'variance'>('list')
  const [showForm, setShowForm] = useState(false)
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())

  const [varRows, setVarRows] = useState<VarianceRow[]>([])
  const [unallocated, setUnallocated] = useState<any[]>([])
  const [totals, setTotals] = useState<any>({})
  const [varLoading, setVarLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '', fiscalYear: new Date().getFullYear(), period: 'ANNUAL', amount: '',
    accountCode: '',
  })

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  const fetchBudgets = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/budgets', { cache: 'no-store' })
      const data = await res.json()
      setBudgets(data.budgets || [])
    } catch { setError('Failed to load') }
    finally { setLoading(false) }
  }

  const fetchVariance = async (year?: number) => {
    setVarLoading(true)
    setError('')
    try {
      const yr = year || fiscalYear
      const res = await fetch('/api/wavecore/finance/reports/budget-vs-actual?fiscalYear=' + yr, { cache: 'no-store' })
      const data = await res.json()
      setVarRows(data.rows || [])
      setUnallocated(data.unallocated || [])
      setTotals(data.totals || {})
    } catch { setError('Failed to load variance') }
    finally { setVarLoading(false) }
  }

  useEffect(() => { fetchBudgets() /* eslint-disable-next-line */ }, [])

  useEffect(() => {
    if (tab === 'variance') fetchVariance(fiscalYear)
    /* eslint-disable-next-line */
  }, [tab, fiscalYear])

  const createBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setFormData({ name: '', fiscalYear: new Date().getFullYear(), period: 'ANNUAL', amount: '', accountCode: '' })
        setShowForm(false)
        fetchBudgets()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Failed')
      }
    } catch { setError('Network error') }
  }

  const deleteBudget = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    try {
      await fetch('/api/wavecore/finance/budgets?id=' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      fetchBudgets()
      if (tab === 'variance') fetchVariance(fiscalYear)
    } catch { setError('Delete failed') }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/finance/budgets/' + id + '/pdf', '_blank')
  }

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtShort = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })

  const handleExportVar = () => {
    let csv = 'Account,Name,Period,Budget,Actual,Variance,Variance %\n'
    varRows.forEach(r => {
      csv += `${r.accountCode},"${r.name}",${r.period},${r.budgetAmount},${r.actual},${r.variance},${r.variancePct ?? ''}\n`
    })
    csv += `,,Total,${totals.budget || 0},${totals.actual || 0},${totals.variance || 0},${totals.variancePct ?? ''}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-vs-actual.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalBudget = useMemo(() => budgets.reduce((s, b) => s + Number(b.amount || 0), 0), [budgets])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/finance" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">Budgets</span>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setTab('list')} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (tab === 'list' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500')}>
            <Wallet className="w-4 h-4" /> Budgets ({budgets.length})
          </button>
          <button onClick={() => setTab('variance')} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (tab === 'variance' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500')}>
            <BarChart3 className="w-4 h-4" /> Budget vs Actual
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}

        {tab === 'list' && (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-6">
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Total budgeted</p>
              <p className="text-3xl font-bold text-emerald-600">{fmt(totalBudget)}</p>
            </div>

            {showForm && (
              <form onSubmit={createBudget} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Fiscal year</label>
                    <input type="number" value={formData.fiscalYear} onChange={(e) => setFormData({ ...formData, fiscalYear: Number(e.target.value) })} className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Period</label>
                    <select value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <option value="ANNUAL">Annual</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Amount</label>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Account code (optional — links this budget to a chart-of-accounts line for variance)</label>
                    <input type="text" value={formData.accountCode} onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" placeholder="e.g. 6300" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Create Budget</button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
                <p className="font-medium">No budgets yet</p>
                <p className="text-sm text-neutral-500 mt-1">Create a budget to compare against actuals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.map(b => (
                  <div key={b.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center">
                    <div className="min-w-0">
                      <p className="font-bold">{b.name}</p>
                      <p className="text-xs text-neutral-500">
                        FY {b.fiscalYear} · {b.period}
                        {b.accountCode && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">acct {b.accountCode}</span>}
                      </p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">{fmt(b.amount)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadPdf(b.id)} className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600" title="PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteBudget(b.id)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'variance' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Fiscal year</p>
                <input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="mt-1 w-full px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-800 text-lg font-bold border border-neutral-200 dark:border-neutral-700"
                />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Total budget</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{fmtShort(totals.budget || 0)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Total actual</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{fmtShort(totals.actual || 0)}</p>
              </div>
              <div className={'p-4 rounded-2xl border ' + ((totals.variance || 0) >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800')}>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Variance {totals.variancePct != null ? '(' + totals.variancePct + '%)' : ''}</p>
                <p className={'text-lg font-bold mt-1 ' + ((totals.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {fmtShort(totals.variance || 0)}
                </p>
              </div>
            </div>

            {totals.overCount > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800 text-red-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {totals.overCount} line{totals.overCount === 1 ? '' : 's'} over budget
              </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Per-account variance</h3>
                <button onClick={handleExportVar} disabled={varRows.length === 0} className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>

              {varLoading ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>
              ) : varRows.length === 0 ? (
                <p className="p-8 text-center text-sm text-neutral-500">
                  No budgets with an account code for FY {fiscalYear}. Add a budget and set its account code to see variance.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-4 py-3">Account</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Period</th>
                        <th className="px-4 py-3 text-right">Budget</th>
                        <th className="px-4 py-3 text-right">Actual</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                        <th className="px-4 py-3 text-right">Var %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {varRows.map(r => (
                        <tr key={r.id} className={'border-b border-neutral-100 dark:border-neutral-800 last:border-0 ' + (r.overBudget ? 'bg-red-50 dark:bg-red-950/20' : '')}>
                          <td className="px-4 py-2 font-mono text-xs">{r.accountCode}</td>
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 text-xs text-neutral-500">{r.period}</td>
                          <td className="px-4 py-2 text-right">{fmt(r.budgetAmount)}</td>
                          <td className="px-4 py-2 text-right">{fmt(r.actual)}</td>
                          <td className={'px-4 py-2 text-right font-bold ' + (r.variance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {r.overBudget && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                            {fmt(r.variance)}
                          </td>
                          <td className={'px-4 py-2 text-right text-xs ' + (r.variance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {r.variancePct != null ? r.variancePct + '%' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-50 dark:bg-neutral-800/30">
                      <tr className="font-bold">
                        <td colSpan={3} className="px-4 py-3 text-right">Totals</td>
                        <td className="px-4 py-3 text-right">{fmt(totals.budget || 0)}</td>
                        <td className="px-4 py-3 text-right">{fmt(totals.actual || 0)}</td>
                        <td className={'px-4 py-3 text-right ' + ((totals.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600')}>{fmt(totals.variance || 0)}</td>
                        <td className="px-4 py-3 text-right text-xs">{totals.variancePct != null ? totals.variancePct + '%' : '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {unallocated.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Unallocated budgets (no account code)</h3>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {unallocated.map((u: any) => (
                      <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2 text-xs text-neutral-500">{u.period}</td>
                        <td className="px-4 py-2 text-right font-bold">{fmt(u.budgetAmount)}</td>
                        <td className="px-4 py-2 text-right text-xs text-neutral-500 italic">no account</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-6 py-3 text-xs text-neutral-500">
                  Edit these budgets (or delete and re-add) and set their account code to see variance.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}