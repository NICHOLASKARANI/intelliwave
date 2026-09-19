'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Wallet, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, DollarSign, Users, TrendingUp, PlayCircle, Sparkles, FileEdit, AlertTriangle,
} from 'lucide-react'

export default function PayrollPage() {
  const [periods, setPeriods] = useState<any[]>([])
  const [activePeriod, setActivePeriod] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('employeeName')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [deleting, setDeleting] = useState('')
  const [running, setRunning] = useState(false)

  const [showCreatePeriod, setShowCreatePeriod] = useState(false)
  const [periodForm, setPeriodForm] = useState({
    name: '', startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10), status: 'DRAFT',
  })

  const fetchAll = async (periodId?: string) => {
    setLoading(true)
    try {
      const url = periodId
        ? '/api/wavecore/hr/payroll?periodId=' + periodId
        : '/api/wavecore/hr/payroll'
      const res = await fetch(url)
      const data = await res.json()
      setPeriods(data.periods || [])
      setActivePeriod(data.activePeriod || null)
      setItems(data.items || data.payroll || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const runPayroll = async () => {
    if (!activePeriod) { setError('No active period — create one first'); return }
    if (!confirm('Generate payslips for all ACTIVE employees in "' + activePeriod.name + '"?\n\nExisting payslips will be skipped.')) return
    setRunning(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', periodId: activePeriod.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(`Payroll run complete · ${data.created} payslips created · ${data.skipped} skipped`)
      fetchAll(activePeriod.id)
    } catch { setError('Network error') }
    finally { setRunning(false) }
  }

  const createPeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!periodForm.name.trim()) { setError('Period name required'); return }
    try {
      const res = await fetch('/api/wavecore/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-period', ...periodForm }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Payroll period created')
      setShowCreatePeriod(false)
      setPeriodForm({ name: '', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), status: 'DRAFT' })
      fetchAll(data.period?.id)
    } catch { setError('Network error') }
  }

  const delItem = async (id: string, name: string) => {
    if (!confirm('Delete payslip for ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/payroll/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Payslip deleted'); fetchAll(activePeriod?.id) }
    } finally { setDeleting('') }
  }

  const delPeriod = async () => {
    if (!activePeriod) return
    if (!confirm('Delete the entire period "' + activePeriod.name + '" and all its payslips?\n\nThis cannot be undone.')) return
    try {
      const res = await fetch('/api/wavecore/hr/payroll?periodId=' + activePeriod.id, { method: 'DELETE' })
      if (res.ok) { flash('Period deleted'); fetchAll() }
    } catch {}
  }

  const pdf = () => {
    const url = activePeriod ? '/api/wavecore/hr/payroll/pdf?periodId=' + activePeriod.id : '/api/wavecore/hr/payroll/pdf'
    window.open(url, '_blank')
  }

  const filtered = useMemo(() => {
    let list = [...items]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.employeeName || '').toLowerCase().includes(s) ||
        (r.empCode || '').toLowerCase().includes(s) ||
        (r.department || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [items, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">HR · Payroll</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Wallet className="w-7 h-7 text-purple-400" /> Payroll
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Periods · Payslips · PAYE · NSSF · SHIF · Housing Levy</p>
          </div>
          <div className="flex gap-3">
            <select
              value={activePeriod?.id || ''}
              onChange={e => fetchAll(e.target.value)}
              className="px-3 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm max-w-[220px]"
            >
              <option value="">— No period —</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
            </select>
            <button onClick={() => fetchAll(activePeriod?.id)} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={() => setShowCreatePeriod(true)} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Period
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={runPayroll} disabled={running || !activePeriod} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40 disabled:opacity-50">
              {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              Run Payroll
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {activePeriod && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-800 flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="text-xs text-purple-300 uppercase tracking-wide font-bold">Active Period</p>
              <p className="text-white font-bold text-lg">{activePeriod.name}</p>
              <p className="text-xs text-neutral-400">
                {activePeriod.startDate ? new Date(activePeriod.startDate).toLocaleDateString('en-GB') : '—'} → {activePeriod.endDate ? new Date(activePeriod.endDate).toLocaleDateString('en-GB') : '—'}
                <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (activePeriod.status === 'PROCESSED' ? 'bg-green-900/60 text-green-300' : 'bg-neutral-800 text-neutral-300')}>{activePeriod.status}</span>
              </p>
            </div>
            <button onClick={delPeriod} className="px-3 py-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 text-xs font-bold flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete Period
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg">
            <Wallet className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalPayslips || 0}</p><p className="text-xs opacity-90">Payslips</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalGross || 0}</p><p className="text-xs opacity-90">Gross</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalPaye || 0}</p><p className="text-xs opacity-90">PAYE</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-orange-600 to-amber-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalNssf || 0}</p><p className="text-xs opacity-90">NSSF</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalShif || 0}</p><p className="text-xs opacity-90">SHIF</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalNet || 0}</p><p className="text-xs opacity-90">Net Pay</p>
          </div>
        </div>

        {summary.unpaidEmployees > 0 && activePeriod && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-900/30 border border-yellow-800 flex items-center gap-2 text-yellow-300 text-sm">
            <AlertTriangle className="w-4 h-4" /> {summary.unpaidEmployees} active employee(s) don't have a payslip in this period yet — click <b>Run Payroll</b> to generate.
          </div>
        )}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee, code or department..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <span className="text-xs text-neutral-500">{filtered.length} of {items.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : !activePeriod ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No payroll period yet</p>
            <button onClick={() => setShowCreatePeriod(true)} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Period
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No payslips yet for "{activePeriod.name}"</p>
            <button onClick={runPayroll} disabled={running} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold inline-flex items-center gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Run Payroll Now
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['employeeName','Employee'],['department','Department'],['gross','Gross'],['paye','PAYE'],['nssf','NSSF'],['shif','SHIF'],['housing','Housing'],['deductions','Total Ded.'],['net','Net Pay']].map(([f,label]) => (
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
                      <td className="p-3 text-white font-medium">{r.employeeName}<br /><span className="font-mono text-[10px] text-neutral-500">{r.empCode || ''}</span></td>
                      <td className="p-3 text-xs text-neutral-400">{r.department || '—'}</td>
                      <td className="p-3 text-right text-white">{Number(r.grossPay || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-red-400">{Number(r.paye || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-red-400">{Number(r.nssf || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-red-400">{Number(r.shif || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-red-400">{Number(r.housingLevy || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-neutral-400">{Number(r.deductions || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-green-400 font-bold">{Number(r.netPay || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => delItem(r.id, r.employeeName)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
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

      {showCreatePeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreatePeriod(false)}>
          <form onSubmit={createPeriod} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> New Payroll Period
              </h2>
              <button type="button" onClick={() => setShowCreatePeriod(false)} className="text-neutral-400 hover:text-purple-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Period Name *</label>
                <input value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. September 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Start</label>
                  <input type="date" value={periodForm.startDate} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">End</label>
                  <input type="date" value={periodForm.endDate} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => setShowCreatePeriod(false)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">Create Period</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}