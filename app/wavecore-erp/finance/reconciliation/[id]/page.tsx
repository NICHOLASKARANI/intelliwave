'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Banknote, RefreshCw, Check, X,
  CheckCircle2, Link2, Unlink, Landmark, Upload, Save,
} from 'lucide-react'

interface Txn {
  id: string
  date: string
  description: string
  reference?: string
  amount: number
  type: string
  matched: boolean
  matchedTransactionId?: string
}

interface Journal {
  id: string
  number: string
  date: string
  reference?: string
  description: string
  debit: number
  credit: number
  net: number
}

interface Reconciliation {
  id: string
  bankAccountId: string
  statementBalance: number
  closingBalance: number
  status: string
}

export default function ReconciliationDetailPage() {
  const params = useParams()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rec, setRec] = useState<Reconciliation | null>(null)
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({})
  const [selectedTxn, setSelectedTxn] = useState<string | null>(null)
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null)
  // FIN-12 — Post adjustment state
  const [showAdjModal, setShowAdjModal] = useState(false)
  const [coaAccounts, setCoaAccounts] = useState<any[]>([])
  const [adjForm, setAdjForm] = useState({
    bankAccountId: '', offsetAccountId: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation/' + id + '/candidates', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setRec(data.reconciliation)
      setTransactions(data.transactions || [])
      setJournals(data.journals || [])
      setSuggestions(data.suggestions || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])
  // FIN-12 — pull CoA accounts lazily the first time the modal opens
  useEffect(() => {
    if (!showAdjModal || coaAccounts.length > 0) return
    fetch('/api/wavecore/gl/chart-of-accounts', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setCoaAccounts(d.accounts || []))
      .catch(() => {})
    // eslint-disable-next-line
  }, [showAdjModal])

  const matchedCount = transactions.filter(t => t.matched).length
  const unmatchedCount = transactions.filter(t => !t.matched).length

  const selectTxn = (txnId: string) => {
    setSelectedTxn(txnId === selectedTxn ? null : txnId)
  }
  const selectJournal = (jId: string) => {
    setSelectedJournal(jId === selectedJournal ? null : jId)
  }

  const matchNow = async (txnId?: string, journalId?: string) => {
    const tid = txnId || selectedTxn
    const jid = journalId || selectedJournal
    if (!tid || !jid) { setError('Select a bank transaction and a journal entry'); return }

    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation/' + id + '/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ transactionId: tid, journalEntryId: jid }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Match failed'); return }
      flash('Matched')
      setSelectedTxn(null); setSelectedJournal(null)
      load()
    } catch (e) { setError('Network error: ' + (e as Error).message) }
    finally { setWorking(false) }
  }

  const unmatch = async (txnId: string) => {
    if (!confirm('Unmatch this transaction?')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation/' + id + '/match?transactionId=' + txnId, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Unmatch failed'); return }
      flash('Unmatched')
      load()
    } catch (e) { setError('Network error: ' + (e as Error).message) }
    finally { setWorking(false) }
  }

  // FIN-12 — compute difference and post a single balancing journal
  const difference = rec ? Number(rec.statementBalance || 0) - Number(rec.closingBalance || 0) : 0
  const adjustNeeded = Math.abs(difference) >= 0.01

  const openAdjModal = () => {
    // Pre-select the first ASSET account for the bank side, first EXPENSE for the offset
    const bankDefault = coaAccounts.find((a: any) => String(a.type).toUpperCase() === 'ASSET')?.id || ''
    const offsetDefault = coaAccounts.find((a: any) => String(a.type).toUpperCase() === 'EXPENSE')?.id || ''
    setAdjForm(f => ({ ...f, bankAccountId: f.bankAccountId || bankDefault, offsetAccountId: f.offsetAccountId || offsetDefault }))
    setShowAdjModal(true)
  }

  const postAdjustment = async () => {
    if (!adjForm.bankAccountId || !adjForm.offsetAccountId) { setError('Select both accounts'); return }
    if (adjForm.bankAccountId === adjForm.offsetAccountId) { setError('The two accounts must be different'); return }
    setWorking(true); setError('')
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation/' + id + '/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(adjForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Adjustment failed'); return }
      flash('Posted ' + data.entry.number + ' — ' + fmt(data.entry.amount))
      setShowAdjModal(false)
      load()
    } catch (e) { setError('Network error: ' + (e as Error).message) }
    finally { setWorking(false) }
  }

  const removeAdjustment = async () => {
    if (!confirm('Remove the posted adjustment for this reconciliation?')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation/' + id + '/adjustment', {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) { setError('Remove failed'); return }
      flash('Adjustment removed')
      setShowAdjModal(false)
      load()
    } catch (e) { setError('Network error: ' + (e as Error).message) }
    finally { setWorking(false) }
  }

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const unmatchedTxns = useMemo(() => transactions.filter(t => !t.matched), [transactions])
  const matchedTxns = useMemo(() => transactions.filter(t => t.matched), [transactions])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!rec) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/finance/reconciliation" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Reconciliation</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <div className="p-6 rounded-2xl bg-red-900/20 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error || 'Not found'}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/finance/reconciliation" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Bank Reconciliation</p>
              <p className="font-bold">Match transactions to journals</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (rec.status === 'MATCHED' ? 'bg-green-900/50 text-green-300' : 'bg-amber-900/50 text-amber-300')}>
              {rec.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button
              onClick={openAdjModal}
              disabled={!adjustNeeded || loading}
              title={adjustNeeded ? 'Post a balancing journal entry' : 'Already balanced'}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <Landmark className="w-4 h-4" /> Post adjustment
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Banknote className="w-4 h-4 mb-2 text-purple-500" />
            <p className="text-lg font-bold">{fmt(rec.statementBalance)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Statement balance</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Banknote className="w-4 h-4 mb-2 text-blue-500" />
            <p className="text-lg font-bold">{fmt(rec.closingBalance)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Book balance</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Link2 className="w-4 h-4 mb-2 text-green-500" />
            <p className="text-lg font-bold">{matchedCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Matched</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Unlink className="w-4 h-4 mb-2 text-amber-500" />
            <p className="text-lg font-bold">{unmatchedCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Unmatched</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        <p className="text-xs text-neutral-500 mb-3">
          Click a bank transaction on the left, then a journal entry on the right, then <strong>Match</strong>. Suggested matches are highlighted.
        </p>

        {/* Two-column matching UI */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Bank transactions */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Bank transactions</h3>
              <span className="text-xs text-neutral-500">{unmatchedTxns.length} unmatched</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {unmatchedTxns.length === 0 && matchedTxns.length === 0 ? (
                <p className="p-6 text-sm text-neutral-500 text-center">No bank transactions for this account.</p>
              ) : (
                <>
                  {unmatchedTxns.map(t => {
                    const isSel = selectedTxn === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => selectTxn(t.id)}
                        className={'w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition ' + (isSel ? 'bg-purple-50 dark:bg-purple-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-neutral-500">{new Date(t.date).toLocaleDateString('en-GB')} · {t.type}</p>
                            <p className="text-sm font-bold truncate">{t.description}</p>
                            {t.reference && <p className="text-[10px] text-neutral-500 truncate">ref {t.reference}</p>}
                          </div>
                          <p className={'text-sm font-bold whitespace-nowrap ' + (t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600')}>
                            {t.type === 'CREDIT' ? '+' : '-'}{fmt(t.amount)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                  {matchedTxns.length > 0 && (
                    <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-y border-neutral-100 dark:border-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
                      Matched ({matchedTxns.length})
                    </div>
                  )}
                  {matchedTxns.map(t => (
                    <div key={t.id} className="w-full px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 opacity-60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-neutral-500">{new Date(t.date).toLocaleDateString('en-GB')} · {t.type}</p>
                          <p className="text-sm font-bold truncate">{t.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={'text-sm font-bold whitespace-nowrap ' + (t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600')}>
                            {t.type === 'CREDIT' ? '+' : '-'}{fmt(t.amount)}
                          </p>
                          <button onClick={() => unmatch(t.id)} className="p-1 rounded-lg text-neutral-500 hover:text-red-500" title="Unmatch">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Journals */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Journal entries</h3>
              <span className="text-xs text-neutral-500">{journals.length} available</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {journals.length === 0 ? (
                <p className="p-6 text-sm text-neutral-500 text-center">No unmatched POSTED journals.</p>
              ) : (
                journals.map(j => {
                  const isSel = selectedJournal === j.id
                  const isSuggested = selectedTxn && (suggestions[selectedTxn] || []).some(s => s.id === j.id)
                  return (
                    <button
                      key={j.id}
                      onClick={() => selectJournal(j.id)}
                      className={'w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition ' +
                        (isSel ? 'bg-purple-50 dark:bg-purple-950/30' : isSuggested ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{j.number}</span>
                            {isSuggested && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/50 text-amber-300 font-bold">suggested</span>}
                          </div>
                          <p className="text-xs text-neutral-500">{new Date(j.date).toLocaleDateString('en-GB')}</p>
                          <p className="text-sm truncate">{j.description}</p>
                          {j.reference && <p className="text-[10px] text-neutral-500 truncate">ref {j.reference}</p>}
                        </div>
                        <p className={'text-sm font-bold whitespace-nowrap ' + (j.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {j.net >= 0 ? '+' : '-'}{fmt(Math.abs(j.net))}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* Match bar */}
        {(selectedTxn || selectedJournal) && (
          <div className="mt-4 p-4 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm">
              <p className="font-bold">
                {selectedTxn ? '1 bank transaction' : '0 transactions'} · {selectedJournal ? '1 journal entry' : '0 journals'}
              </p>
              <p className="text-xs opacity-70">Select one of each, then click Match.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedTxn(null); setSelectedJournal(null) }} className="px-4 py-2 rounded-xl border border-white/30 dark:border-black/20 text-sm font-bold">
                Clear
              </button>
              <button onClick={() => matchNow()} disabled={working || !selectedTxn || !selectedJournal} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Match
              </button>
            </div>
          </div>
        )}

        {/* FIN-12 — Post adjustment modal */}
        {showAdjModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAdjModal(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold flex items-center gap-2"><Landmark className="w-5 h-5 text-purple-500" /> Post adjustment</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Creates one journal entry to close the difference.</p>
                </div>
                <button onClick={() => setShowAdjModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Preview */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Statement</p>
                      <p className="font-bold">{fmt(rec?.statementBalance || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Book</p>
                      <p className="font-bold">{fmt(rec?.closingBalance || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Difference</p>
                      <p className={'font-bold ' + (difference > 0 ? 'text-green-600' : 'text-red-600')}>{fmt(difference)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">
                    {difference > 0
                      ? <>Entry will be <strong>Dr bank account / Cr offset account</strong> for {fmt(Math.abs(difference))}.</>
                      : <>Entry will be <strong>Dr offset account / Cr bank account</strong> for {fmt(Math.abs(difference))}.</>}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Bank GL account</label>
                  <select
                    value={adjForm.bankAccountId}
                    onChange={e => setAdjForm({ ...adjForm, bankAccountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    <option value="">— select —</option>
                    {coaAccounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Offset account (bank charges / suspense)</label>
                  <select
                    value={adjForm.offsetAccountId}
                    onChange={e => setAdjForm({ ...adjForm, offsetAccountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    <option value="">— select —</option>
                    {coaAccounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={adjForm.date}
                    onChange={e => setAdjForm({ ...adjForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-800/30">
                <button
                  onClick={removeAdjustment}
                  disabled={working}
                  className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold disabled:opacity-40"
                  title="Remove any previously posted adjustment for this reconciliation"
                >
                  <Unlink className="w-3.5 h-3.5 inline mr-1" /> Remove posted
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setShowAdjModal(false)} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">Cancel</button>
                  <button
                    onClick={postAdjustment}
                    disabled={working || !adjForm.bankAccountId || !adjForm.offsetAccountId}
                    className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40"
                  >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Post entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}