'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Calendar, Lock, Unlock, Plus, AlertTriangle,
  CheckCircle2, RefreshCw,
} from 'lucide-react'

interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  isClosed: boolean
  journalCount?: number
}

interface Year {
  id: string
  name: string
  startDate: string
  endDate: string
  isClosed: boolean
  periods: Period[]
}

export default function FiscalPeriodsPage() {
  const [years, setYears] = useState<Year[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [working, setWorking] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ year: new Date().getFullYear(), startMonth: 1 })

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/finance/fiscal-periods', { cache: 'no-store' })
      const data = await res.json()
      setYears(data.fiscalYears || [])
    } catch { setError('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 30000)
    return () => clearInterval(t)
  }, [])

  const createYear = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/fiscal-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Fiscal year created')
      setShowForm(false)
      load()
    } catch { setError('Network error') }
  }

  const toggleClosed = async (p: Period) => {
    const verb = p.isClosed ? 'reopen' : 'close'
    if (!confirm('Are you sure you want to ' + verb + ' ' + p.name + '? ' + (p.isClosed ? '' : 'New POSTED entries in this period will be blocked.'))) return
    setWorking(p.id)
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/fiscal-periods/' + p.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ isClosed: !p.isClosed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(p.name + ' ' + (p.isClosed ? 'reopened' : 'closed'))
      load()
    } catch { setError('Network error') }
    finally { setWorking('') }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/finance" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold">Fiscal Periods</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Fiscal Year
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Fiscal Periods &amp; Locking</h1>
          <p className="text-sm text-neutral-500 mt-1">Close a period to lock its journal entries. Reopen to allow new POSTED entries.</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createYear} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-sm font-bold mb-4">Create fiscal year</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Year</label>
                <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Start month</label>
                <select value={formData.startMonth} onChange={e => setFormData({ ...formData, startMonth: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm">Create</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : years.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No fiscal years yet</p>
            <p className="text-sm text-neutral-500 mt-1">Create one to enable period close and locking.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {years.map(y => (
              <div key={y.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{y.name}</h3>
                    <p className="text-xs text-neutral-500">
                      {new Date(y.startDate).toLocaleDateString('en-GB')} → {new Date(y.endDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-6 py-3">Period</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3 text-right">Journals</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {y.periods.map(p => (
                      <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800">
                        <td className="px-6 py-2 font-medium">{p.name}</td>
                        <td className="px-4 py-2 text-xs text-neutral-500">
                          {new Date(p.startDate).toLocaleDateString('en-GB')} → {new Date(p.endDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-2 text-right text-xs">{p.journalCount ?? 0}</td>
                        <td className="px-4 py-2 text-center">
                          {p.isClosed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-300">
                              <Lock className="w-3 h-3" /> Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/40 text-green-300">
                              <Unlock className="w-3 h-3" /> Open
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2 text-right">
                          <button
                            onClick={() => toggleClosed(p)}
                            disabled={working === p.id}
                            className={
                              'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto disabled:opacity-40 ' +
                              (p.isClosed ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-red-900/30 text-red-300 hover:bg-red-900/50')
                            }
                          >
                            {working === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                              p.isClosed ? <><Unlock className="w-3 h-3" /> Reopen</> :
                              <><Lock className="w-3 h-3" /> Close</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}