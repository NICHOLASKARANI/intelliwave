'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Download, FileText, Calendar, Users, AlertTriangle,
  RefreshCw, Landmark, ChevronDown,
} from 'lucide-react'

interface Period { id: string; name: string; startDate: string; endDate: string; paymentDate: string | null; status: string }

interface Row {
  id: string
  payrollPeriodId: string
  periodName: string
  employeeCode: string
  employeeName: string
  taxPin: string
  nssfNumber: string
  nhifNumber: string
  department: string
  position: string
  grossPay: number
  paye: number
  nssf: number
  shif: number
  housingLevy: number
  netPay: number
}

interface Totals {
  gross: number
  paye: number
  nssfEmployee: number
  nssfEmployer: number
  nssfTotal: number
  shif: number
  housingEmployee: number
  housingEmployer: number
  housingTotal: number
  net: number
  payable: { paye: number; shif: number; housing: number; nssf: number; total: number }
}

interface Counts { periods: number; payslips: number; zeroPaye: number; nssfCapped: number; employees: number }

export default function StatutorySummaryPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [items, setItems] = useState<Row[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [counts, setCounts] = useState<Counts | null>(null)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')
  const [mode, setMode] = useState<'period' | 'range'>('period')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtShort = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })

  const loadPeriods = async () => {
    try {
      const res = await fetch('/api/wavecore/hr/payroll', { cache: 'no-store' })
      const data = await res.json()
      setPeriods(data.periods || [])
      if (!selectedPeriodId && (data.activePeriod?.id || data.periods?.[0]?.id)) {
        setSelectedPeriodId(data.activePeriod?.id || data.periods[0].id)
      }
    } catch {
      // HR module refused or unreachable — the range mode still works.
    }
  }

  const loadReport = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    setError(''); setMessage('')
    try {
      let qs = ''
      if (mode === 'period' && selectedPeriodId) qs = '?periodId=' + encodeURIComponent(selectedPeriodId)
      else if (mode === 'range' && (from || to)) {
        const p = new URLSearchParams()
        if (from) p.set('from', from)
        if (to) p.set('to', to)
        qs = '?' + p.toString()
      }
      const res = await fetch('/api/wavecore/finance/reports/statutory-summary' + qs, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setItems(data.items || [])
      setTotals(data.totals || null)
      setCounts(data.counts || null)
      if (data.message) setMessage(data.message)
    } catch { setError('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { loadPeriods() /* eslint-disable-next-line */ }, [])
  useEffect(() => { loadReport() /* eslint-disable-next-line */ }, [mode, selectedPeriodId, from, to])
  useEffect(() => {
    const t = setInterval(() => loadReport({ silent: true }), 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [mode, selectedPeriodId, from, to])

  const handleExport = () => {
    if (!items.length) return
    let csv = 'EmployeeCode,Employee,TaxPIN,NSSFNo,Department,Period,Gross,PAYE,NSSF,SHIF,HousingLevy,NetPay\n'
    items.forEach(r => {
      csv += [r.employeeCode, '"' + r.employeeName + '"', r.taxPin, r.nssfNumber, '"' + r.department + '"', '"' + r.periodName + '"', r.grossPay, r.paye, r.nssf, r.shif, r.housingLevy, r.netPay].join(',') + '\n'
    })
    if (totals) {
      csv += '\n,,Totals,,,,'
      csv += [totals.gross, totals.paye, totals.nssfTotal, totals.shif, totals.housingTotal, totals.net].join(',') + '\n'
      csv += '\n,,Employer-side,,,,'
      csv += [0, 0, totals.nssfEmployer, 0, totals.housingEmployer, 0].join(',') + '\n'
      csv += '\n,,KRA payable,,,,'
      csv += [0, totals.payable.paye, totals.payable.nssf, totals.payable.shif, totals.payable.housing, totals.payable.total].join(',') + '\n'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'statutory-summary.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  const selectedPeriod = useMemo(() => periods.find(p => p.id === selectedPeriodId) || null, [periods, selectedPeriodId])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 print:hidden">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/finance" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold">Statutory Summary</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadReport({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={handleExport} disabled={items.length === 0} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={handlePrint} disabled={items.length === 0} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <FileText className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6 flex items-end justify-between flex-wrap gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Statutory Summary — PAYE · NSSF · SHIF · Housing Levy</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Reads the payroll breakdown already stored on each payslip. Nothing here recalculates.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setMode('period')} className={'px-3 py-2 text-xs font-bold ' + (mode === 'period' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-500')}>By period</button>
              <button onClick={() => setMode('range')} className={'px-3 py-2 text-xs font-bold ' + (mode === 'range' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-500')}>By range</button>
            </div>
            {mode === 'period' ? (
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Period</label>
                <div className="relative">
                  <select
                    value={selectedPeriodId}
                    onChange={e => setSelectedPeriodId(e.target.value)}
                    className="appearance-none px-3 pr-8 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm min-w-[240px]"
                  >
                    <option value="">— latest —</option>
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {new Date(p.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {p.status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">From</label>
                  <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">To</label>
                  <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
                </div>
              </>
            )}
          </div>
        </div>

        {selectedPeriod && mode === 'period' && (
          <div className="mb-4 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            {new Date(selectedPeriod.startDate).toLocaleDateString('en-GB')} → {new Date(selectedPeriod.endDate).toLocaleDateString('en-GB')}
            {selectedPeriod.paymentDate ? <> · paid {new Date(selectedPeriod.paymentDate).toLocaleDateString('en-GB')}</> : null}
            &nbsp;· status {selectedPeriod.status}
          </div>
        )}

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {message && <div className="mb-4 p-4 rounded-xl bg-blue-900/20 text-blue-200 border border-blue-800 text-sm">{message}</div>}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Landmark className="w-5 h-5 mb-2 text-red-500" />
            <p className="text-lg font-bold">{fmtShort(totals?.paye || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">PAYE remitted</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Landmark className="w-5 h-5 mb-2 text-orange-500" />
            <p className="text-lg font-bold">{fmtShort(totals?.nssfTotal || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">NSSF (emp + employer)</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Landmark className="w-5 h-5 mb-2 text-cyan-500" />
            <p className="text-lg font-bold">{fmtShort(totals?.shif || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">SHIF</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Landmark className="w-5 h-5 mb-2 text-amber-500" />
            <p className="text-lg font-bold">{fmtShort(totals?.housingTotal || 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Housing Levy (emp + employer)</p>
          </div>
        </div>

        {/* Payable tile */}
        <div className="mb-6 p-5 rounded-2xl bg-indigo-600 text-white flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide font-bold opacity-80">Total KRA payable</p>
            <p className="text-xs opacity-80">PAYE + SHIF + Housing Levy + NSSF · employee and employer side</p>
          </div>
          <p className="text-3xl font-bold">{fmt(totals?.payable?.total || 0)}</p>
        </div>

        {/* Counts */}
        {counts && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Periods</p>
              <p className="font-bold">{counts.periods}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Payslips</p>
              <p className="font-bold">{counts.payslips}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Employees</p>
              <p className="font-bold">{counts.employees}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Zero PAYE</p>
              <p className="font-bold">{counts.zeroPaye}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">NSSF at ceiling</p>
              <p className="font-bold">{counts.nssfCapped}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No payslips in this selection</p>
            <p className="text-sm text-neutral-500 mt-1">Run payroll from the HR module and the summary appears here.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Employee</th>
                    <th className="px-3 py-3">Tax PIN</th>
                    <th className="px-3 py-3">Dept</th>
                    <th className="px-3 py-3 text-right">Gross</th>
                    <th className="px-3 py-3 text-right">PAYE</th>
                    <th className="px-3 py-3 text-right">NSSF</th>
                    <th className="px-3 py-3 text-right">SHIF</th>
                    <th className="px-3 py-3 text-right">Housing</th>
                    <th className="px-3 py-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{r.employeeCode}</td>
                      <td className="px-3 py-2">{r.employeeName}</td>
                      <td className="px-3 py-2 font-mono text-xs text-neutral-500">{r.taxPin || '—'}</td>
                      <td className="px-3 py-2 text-xs text-neutral-500">{r.department}</td>
                      <td className="px-3 py-2 text-right">{fmt(r.grossPay)}</td>
                      <td className="px-3 py-2 text-right text-red-500">{fmt(r.paye)}</td>
                      <td className="px-3 py-2 text-right text-orange-500">{fmt(r.nssf)}</td>
                      <td className="px-3 py-2 text-right text-cyan-500">{fmt(r.shif)}</td>
                      <td className="px-3 py-2 text-right text-amber-500">{fmt(r.housingLevy)}</td>
                      <td className="px-3 py-2 text-right font-bold text-green-600">{fmt(r.netPay)}</td>
                    </tr>
                  ))}
                </tbody>
                {totals && (
                  <tfoot className="bg-neutral-50 dark:bg-neutral-800/40 font-bold">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-right">Totals</td>
                      <td className="px-3 py-3 text-right">{fmt(totals.gross)}</td>
                      <td className="px-3 py-3 text-right text-red-500">{fmt(totals.paye)}</td>
                      <td className="px-3 py-3 text-right text-orange-500">{fmt(totals.nssfEmployee)}</td>
                      <td className="px-3 py-3 text-right text-cyan-500">{fmt(totals.shif)}</td>
                      <td className="px-3 py-3 text-right text-amber-500">{fmt(totals.housingEmployee)}</td>
                      <td className="px-3 py-3 text-right text-green-600">{fmt(totals.net)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* KRA payable breakdown */}
        {totals && (
          <div className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Remittance breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-6 py-2">PAYE (employee side)</td>
                  <td className="px-6 py-2 text-right font-bold">{fmt(totals.paye)}</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-6 py-2">NSSF — employee side</td>
                  <td className="px-6 py-2 text-right">{fmt(totals.nssfEmployee)}</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-6 py-2">NSSF — employer side</td>
                  <td className="px-6 py-2 text-right">{fmt(totals.nssfEmployer)}</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-6 py-2">SHIF (2.75% employee)</td>
                  <td className="px-6 py-2 text-right font-bold">{fmt(totals.shif)}</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-6 py-2">Housing Levy — employee side (1.5%)</td>
                  <td className="px-6 py-2 text-right">{fmt(totals.housingEmployee)}</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-6 py-2">Housing Levy — employer side (1.5%)</td>
                  <td className="px-6 py-2 text-right">{fmt(totals.housingEmployer)}</td>
                </tr>
                <tr className="bg-indigo-50 dark:bg-indigo-950/40">
                  <td className="px-6 py-3 font-bold">Total payable</td>
                  <td className="px-6 py-3 text-right font-bold text-indigo-700 dark:text-indigo-300">{fmt(totals.payable.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-neutral-500 mt-6">
          Figures are aggregated from the payroll breakdown already stored per payslip. Nothing on this page recalculates
          statutory amounts — change the bands in <strong>HR → Payroll → Statutory bands</strong> to affect future runs.
        </p>
      </main>
    </div>
  )
}