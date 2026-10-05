'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, RefreshCw, Save, AlertTriangle, CheckCircle2,
  Wallet, Info,
} from 'lucide-react'

interface Account {
  id: string
  code: string
  name: string
  type: string
  debit: number
  credit: number
}

interface CurrentEntry {
  id: string
  number: string
  date: string
  description: string
  status: string
}

export default function OpeningBalancesPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentEntry, setCurrentEntry] = useState<CurrentEntry | null>(null)
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 4000) }

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/finance/opening-balances', { cache: 'no-store' })
      const data = await res.json()
      setAccounts(data.accounts || [])
      setCurrentEntry(data.currentEntry || null)
      if (data.currentEntry?.date) setAsOf(new Date(data.currentEntry.date).toISOString().slice(0, 10))
    } catch { setError('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 30000)
    return () => clearInterval(t)
  }, [])

  const totals = useMemo(() => {
    const debit  = accounts.reduce((s, a) => s + Number(a.debit  || 0), 0)
    const credit = accounts.reduce((s, a) => s + Number(a.credit || 0), 0)
    return { debit, credit, difference: debit - credit }
  }, [accounts])

  const balanced = Math.abs(totals.difference) < 0.01

  const setAmount = (id: string, side: 'debit' | 'credit', value: string) => {
    const n = value === '' ? 0 : Math.max(0, Number(value) || 0)
    setAccounts(prev => prev.map(a => {
      if (a.id !== id) return a
      // Setting one side clears the other (each line is debit OR credit)
      if (side === 'debit')  return { ...a, debit: n,  credit: n > 0 ? 0 : a.credit }
      return { ...a, credit: n, debit: n > 0 ? 0 : a.debit }
    }))
  }

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const save = async () => {
    if (!balanced) { setError('Debits must equal credits'); return }
    const lines = accounts
      .filter(a => a.debit > 0 || a.credit > 0)
      .map(a => ({ accountId: a.id, debit: a.debit, credit: a.credit }))
    if (lines.length < 2) { setError('Enter at least two lines'); return }

    if (currentEntry && !confirm('An opening entry already exists (' + currentEntry.number + '). Saving will replace it. Continue?')) return

    setSaving(true); setError('')
    try {
      const res = await fetch('/api/wavecore/finance/opening-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ asOf, lines }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      flash('Opening balances saved as ' + data.entry.number)
      load()
    } catch (e) { setError('Network error: ' + (e as Error).message) }
    finally { setSaving(false) }
  }

  const clearAll = () => {
    if (!confirm('Clear all inputs? This does NOT delete the saved entry until you Save.')) return
    setAccounts(prev => prev.map(a => ({ ...a, debit: 0, credit: 0 })))
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
            <span className="font-bold">Opening Balances</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={clearAll} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-500">
              Clear
            </button>
            <button onClick={save} disabled={saving || !balanced} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6 flex flex-wrap items-end gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold">Opening Balances</h1>
            <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
              Enter the starting position for each account as of a chosen date. Saving creates one POSTED journal entry tagged
              &ldquo;[OPENING BALANCE]&rdquo;. Saving again replaces it.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">As of</label>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
            </div>
          </div>
        </div>

        {currentEntry && (
          <div className="mb-4 p-3 rounded-xl bg-blue-900/20 border border-blue-800 text-blue-200 text-xs flex items-center gap-2">
            <Info className="w-4 h-4" />
            Current opening entry: <span className="font-mono font-bold">{currentEntry.number}</span>
            &nbsp;· {new Date(currentEntry.date).toLocaleDateString('en-GB')} · {currentEntry.status}
          </div>
        )}

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Balance bar */}
        <div className={'mb-6 p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ' +
          (balanced
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800')}>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Total debits</p>
              <p className="text-lg font-bold">{fmt(totals.debit)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Total credits</p>
              <p className="text-lg font-bold">{fmt(totals.credit)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Difference</p>
              <p className={'text-lg font-bold ' + (balanced ? 'text-green-600' : 'text-red-600')}>{fmt(totals.difference)}</p>
            </div>
          </div>
          <div className={'flex items-center gap-2 text-sm font-bold ' + (balanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
            {balanced ? <><CheckCircle2 className="w-5 h-5" /> Balanced</> : <><AlertTriangle className="w-5 h-5" /> Not balanced</>}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No chart of accounts yet</p>
            <p className="text-sm text-neutral-500 mt-1">Set up your chart of accounts first, then enter opening balances.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                  <th className="px-4 py-3 w-24">Code</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 w-28">Type</th>
                  <th className="px-4 py-3 text-right w-40">Debit</th>
                  <th className="px-4 py-3 text-right w-40">Credit</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{a.code}</td>
                    <td className="px-4 py-2">{a.name}</td>
                    <td className="px-4 py-2 text-xs text-neutral-500">{a.type}</td>
                    <td className="px-4 py-1">
                      <input
                        type="number" min={0} step="0.01"
                        value={a.debit || ''}
                        onChange={e => setAmount(a.id, 'debit', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-right"
                      />
                    </td>
                    <td className="px-4 py-1">
                      <input
                        type="number" min={0} step="0.01"
                        value={a.credit || ''}
                        onChange={e => setAmount(a.id, 'credit', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 dark:bg-neutral-800/30">
                <tr className="font-bold">
                  <td colSpan={3} className="px-4 py-3 text-right">Totals</td>
                  <td className="px-4 py-3 text-right">{fmt(totals.debit)}</td>
                  <td className="px-4 py-3 text-right">{fmt(totals.credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}