'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Users, Search, Trash2, Loader2, Printer, Mail, Phone, Filter, ExternalLink, Building2, X, UserPlus, CheckSquare } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: string
  priority?: string
  source?: string
  score?: number
  customerId?: string
  createdAt: string
}

// ============================================================
// Lead scoring — rule-based, mirrors /api/ai/lead-score logic.
// Deterministic so the badge is stable across renders.
// ============================================================
function scoreLead(lead: { company?: string; source?: string; priority?: string; status?: string }): number {
  let score = 0

  const company = (lead.company || '').toLowerCase()
  if (company) {
    if (company.includes('bank') || company.includes('hospital') || company.includes('government')) score += 30
    else if (company.includes('tech') || company.includes('startup')) score += 20
    else if (company.includes('ltd') || company.includes('limited') || company.includes('inc') || company.includes('llc')) score += 15
    else score += 10
  }

  const source = (lead.source || '').toLowerCase()
  if (source.includes('referral')) score += 25
  else if (source.includes('linkedin')) score += 20
  else if (source.includes('website')) score += 15
  else if (source.includes('event')) score += 15
  else if (source.includes('cold')) score += 5
  else score += 10

  const priority = (lead.priority || 'MEDIUM').toUpperCase()
  if (priority === 'URGENT') score += 30
  else if (priority === 'HIGH') score += 20
  else if (priority === 'MEDIUM') score += 10

  const status = (lead.status || 'NEW').toUpperCase()
  if (status === 'QUALIFIED') score += 25
  else if (status === 'PROPOSAL') score += 20
  else if (status === 'NEGOTIATION') score += 15
  else if (status === 'CONTACTED') score += 10
  else if (status === 'WON') score += 25
  else if (status === 'LOST') score -= 20
  else score += 5

  return Math.max(0, Math.min(100, score))
}

function scoreBadge(score: number): { icon: string; label: string; className: string } {
  if (score >= 70) return { icon: '🔥', label: 'Hot',  className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
  if (score >= 40) return { icon: '⚡', label: 'Warm', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
  return { icon: '❄', label: 'Cold', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' }
}

const LEAD_STATUSES = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | 'assign' | 'status'>('assign')
  const [bulkAssignedTo, setBulkAssignedTo] = useState('')
  const [bulkStatus, setBulkStatus] = useState('NEW')
  const [team, setTeam] = useState<any[]>([])

  useEffect(() => {
    fetchLeads()
    fetch('/api/wavecore/crm/team', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setTeam(d.members || []))
      .catch(() => {})
  }, [])

  // 30-second silent auto-refresh
  useEffect(() => {
    const t = setInterval(() => { fetchLeads({ silent: true }) }, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [])

  const fetchLeads = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/leads')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      setError('Failed to load leads')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/leads?id=${id}`, { method: 'DELETE' , headers: { 'X-CSRF-Token': csrf() } })
      if (res.ok) {
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
        fetchLeads()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/leads/${id}/pdf`, '_blank')
  }

  const filtered = leads.filter(l =>
    (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-700'
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-700'
      case 'QUALIFIED': return 'bg-green-100 text-green-700'
      case 'WON': return 'bg-emerald-100 text-emerald-700'
      case 'LOST': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // ---- Bulk selection helpers ----
  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id))
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
      if (filtered.every(l => prev.has(l.id))) {
        const n = new Set(prev)
        filtered.forEach(l => n.delete(l.id))
        return n
      }
      const n = new Set(prev)
      filtered.forEach(l => n.add(l.id))
      return n
    })
  }

  const clearSelection = () => setSelected(new Set())

  const bulkApply = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)

    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${ids.length} lead${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return
    }

    setBulkBusy(true)
    setError('')
    try {
      let payload: any = {}
      if (bulkAction === 'assign')  payload = { assignedToId: bulkAssignedTo || null }
      if (bulkAction === 'status')  payload = { status: bulkStatus }

      const res = await fetch('/api/wavecore/crm/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ ids, action: bulkAction, payload }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bulk action failed'); return }
      clearSelection()
      setBulkOpen(false)
      fetchLeads()
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
          <span className="text-sm">Leads</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8 pb-32">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="w-6 h-6 text-purple-500" /> Leads ({leads.length})
          </h1>
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <button
                onClick={toggleAll}
                className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 hover:border-purple-400"
                title={allFilteredSelected ? 'Deselect all' : 'Select all'}
              >
                <CheckSquare className="w-4 h-4 text-purple-500" />
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
            <Link href="/wavecore-erp/crm/leads/create"
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Lead
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search leads..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No leads yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => {
              const isSel = selected.has(lead.id)
              return (
                <div key={lead.id}
                  className={
                    'p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center gap-3 transition-all ' +
                    (isSel ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-purple-300')
                  }>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleOne(lead.id)}
                      className={
                        'mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ' +
                        (isSel ? 'bg-purple-600 border-purple-600' : (someSelected ? 'border-purple-400 bg-white dark:bg-neutral-900' : 'border-neutral-300 dark:border-neutral-700 group-hover:border-purple-400'))
                      }
                      title={isSel ? 'Deselect' : 'Select'}
                      aria-checked={isSel}
                    >
                      {isSel && <span className="text-white text-xs font-bold">✓</span>}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={'/wavecore-erp/crm/leads/' + lead.id} className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
                          {lead.name || 'N/A'}
                        </Link>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                        {lead.priority && (
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            lead.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                            lead.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            lead.priority === 'LOW' ? 'bg-neutral-100 text-neutral-600' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{lead.priority}</span>
                        )}
                        {lead.customerId && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">converted</span>
                        )}
                        {(() => {
                          const s = scoreLead(lead)
                          const b = scoreBadge(s)
                          return (
                            <span
                              className={'px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ' + b.className}
                              title={'Lead score: ' + s + '/100 — ' + b.label}
                            >
                              <span>{b.icon}</span>
                              <span>{b.label} {s}</span>
                            </span>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                        {lead.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {lead.company}</span>}
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Source: {lead.source || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPdf(lead.id)} title="Download PDF"
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <Printer className="w-4 h-4" />
                    </button>
                    <Link href={'/wavecore-erp/crm/leads/' + lead.id} title="Open"
                      className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteLead(lead.id)} title="Delete"
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                      {deleting === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
          <button onClick={() => setBulkOpen(true)} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center gap-2">
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
              <h3 className="font-bold">Bulk action on {selected.size} lead{selected.size === 1 ? '' : 's'}</h3>
              <button onClick={() => setBulkOpen(false)} disabled={bulkBusy} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['assign','status','delete'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setBulkAction(a)}
                      className={'px-3 py-2 rounded-xl text-sm font-bold capitalize ' +
                        (bulkAction === a
                          ? (a === 'delete' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white')
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

              {bulkAction === 'status' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2">New status</label>
                  <select
                    value={bulkStatus}
                    onChange={e => setBulkStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {bulkAction === 'delete' && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 text-xs">
                  This will permanently delete {selected.size} lead{selected.size === 1 ? '' : 's'}. Cannot be undone.
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
                  (bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500')}
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