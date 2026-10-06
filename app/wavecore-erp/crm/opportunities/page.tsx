'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Target, Search, Trash2, Loader2, Printer, DollarSign, ExternalLink, X, UserPlus, CheckSquare, Percent } from 'lucide-react'

interface Opportunity {
  id: string
  name: string
  title: string
  amount: number
  value: number
  stage: string
  status: string
  createdAt: string
  probability?: number
  expectedCloseDate?: string
  assignedToId?: string
}

const STAGE_OPTIONS = ['QUALIFICATION','NEEDS_ANALYSIS','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST']

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkAction, setBulkAction] = useState<'assign' | 'stage' | 'probability' | 'delete'>('stage')
  const [bulkAssignedTo, setBulkAssignedTo] = useState('')
  const [bulkStage, setBulkStage] = useState('QUALIFICATION')
  const [bulkProbability, setBulkProbability] = useState('50')
  const [team, setTeam] = useState<any[]>([])

  useEffect(() => {
    fetchOpportunities()
    fetch('/api/wavecore/crm/team', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setTeam(d.members || []))
      .catch(() => {})
  }, [])

  // 30-second silent auto-refresh
  useEffect(() => {
    const t = setInterval(() => { fetchOpportunities({ silent: true }) }, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [])

  const fetchOpportunities = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/opportunities')
      const data = await res.json()
      setOpportunities(data.opportunities || [])
    } catch (err) {
      setError('Failed to load opportunities')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  const deleteOpportunity = async (id: string) => {
    if (!confirm('Delete this opportunity?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/opportunities?id=${id}`, { method: 'DELETE' , headers: { 'X-CSRF-Token': csrf() } })
      if (res.ok) {
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
        fetchOpportunities()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/opportunities/${id}/pdf`, '_blank')
  }

  const filtered = opportunities.filter(o =>
    (o.name || o.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const stageColor = (stage: string) => {
    switch (stage?.toUpperCase()) {
      case 'QUALIFICATION': return 'bg-yellow-100 text-yellow-700'
      case 'NEEDS_ANALYSIS': return 'bg-cyan-100 text-cyan-700'
      case 'PROPOSAL': return 'bg-purple-100 text-purple-700'
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-700'
      case 'CLOSED_WON': return 'bg-green-100 text-green-700'
      case 'CLOSED_LOST': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const totalValue = opportunities.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)

  // ---- Bulk helpers ----
  const allFilteredSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id))
  const someSelected = selected.size > 0

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    setSelected(prev => {
      if (filtered.every(o => prev.has(o.id))) {
        const n = new Set(prev)
        filtered.forEach(o => n.delete(o.id))
        return n
      }
      const n = new Set(prev)
      filtered.forEach(o => n.add(o.id))
      return n
    })
  }

  const clearSelection = () => setSelected(new Set())

  const bulkApply = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)

    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${ids.length} opportunit${ids.length === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return
    }

    setBulkBusy(true)
    setError('')
    try {
      let payload: any = {}
      if (bulkAction === 'assign')      payload = { assignedToId: bulkAssignedTo || null }
      if (bulkAction === 'stage')       payload = { stage: bulkStage }
      if (bulkAction === 'probability') payload = { probability: parseInt(bulkProbability) || 0 }

      const res = await fetch('/api/wavecore/crm/opportunities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ ids, action: bulkAction, payload }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bulk action failed'); return }
      clearSelection()
      setBulkOpen(false)
      fetchOpportunities()
    } catch {
      setError('Network error')
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Opportunities</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8 pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" /> Opportunities ({opportunities.length})
            </h1>
            <p className="text-sm text-muted-foreground">Total Pipeline: KSh {totalValue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <button
                onClick={toggleAll}
                className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 hover:border-emerald-400"
                title={allFilteredSelected ? 'Deselect all' : 'Select all'}
              >
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
            <Link href="/wavecore-erp/crm/opportunities/create"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Opportunity
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search opportunities..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No opportunities yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(opp => {
              const isSel = selected.has(opp.id)
              return (
                <div key={opp.id}
                  className={
                    'p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center gap-3 transition-all ' +
                    (isSel ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-emerald-300')
                  }>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleOne(opp.id)}
                      className={
                        'mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ' +
                        (isSel ? 'bg-emerald-600 border-emerald-600' : (someSelected ? 'border-emerald-400 bg-white dark:bg-neutral-900' : 'border-neutral-300 dark:border-neutral-700'))
                      }
                      title={isSel ? 'Deselect' : 'Select'}
                      aria-checked={isSel}
                    >
                      {isSel && <span className="text-white text-xs font-bold">✓</span>}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={'/wavecore-erp/crm/opportunities/' + opp.id} className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                          {opp.name || opp.title || 'N/A'}
                        </Link>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${stageColor(opp.stage)}`}>
                          {opp.stage || opp.status}
                        </span>
                        {typeof opp.probability === 'number' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {opp.probability}%
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-emerald-600 flex items-center gap-1 mt-1">
                        <DollarSign className="w-4 h-4" /> KSh {Number(opp.amount || opp.value || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPdf(opp.id)} title="Download PDF"
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <Printer className="w-4 h-4" />
                    </button>
                    <Link href={'/wavecore-erp/crm/opportunities/' + opp.id} title="Open"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteOpportunity(opp.id)} title="Delete"
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                      {deleting === opp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Sticky bulk action bar */}
      {someSelected && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 flex-wrap max-w-[95vw]">
          <span className="text-sm font-bold whitespace-nowrap">{selected.size} selected</span>
          <button onClick={() => setBulkOpen(true)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Bulk action
          </button>
          <button onClick={clearSelection} className="px-4 py-2 rounded-xl bg-neutral-700 dark:bg-neutral-200 text-white dark:text-black text-sm font-bold flex items-center gap-2">
            <X className="w-4 h-4" /> Clear
          </button>
        </div>
      )}

      {/* Bulk action modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !bulkBusy && setBulkOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold">Bulk action on {selected.size} opportunit{selected.size === 1 ? 'y' : 'ies'}</h3>
              <button onClick={() => setBulkOpen(false)} disabled={bulkBusy} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2">Action</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['assign','stage','probability','delete'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setBulkAction(a)}
                      className={'px-2 py-2 rounded-xl text-xs font-bold capitalize ' +
                        (bulkAction === a
                          ? (a === 'delete' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500')}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {bulkAction === 'assign' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2">Assign to</label>
                  <select
                    value={bulkAssignedTo}
                    onChange={e => setBulkAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {team.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                  </select>
                </div>
              )}

              {bulkAction === 'stage' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2">New stage</label>
                  <select
                    value={bulkStage}
                    onChange={e => setBulkStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              )}

              {bulkAction === 'probability' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2">Probability (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bulkProbability}
                    onChange={e => setBulkProbability(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  />
                </div>
              )}

              {bulkAction === 'delete' && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 text-xs">
                  This will permanently delete {selected.size} opportunit{selected.size === 1 ? 'y' : 'ies'}. Cannot be undone.
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
              <button onClick={() => setBulkOpen(false)} disabled={bulkBusy} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm disabled:opacity-40">
                Cancel
              </button>
              <button
                onClick={bulkApply}
                disabled={bulkBusy}
                className={'px-6 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 ' +
                  (bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500')}
              >
                {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Apply to {selected.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}