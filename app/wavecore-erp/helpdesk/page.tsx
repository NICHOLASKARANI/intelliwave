'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { LifeBuoy, Plus, Search, Clock, CheckCircle2, AlertCircle, BookOpen, Settings2, Loader2 } from 'lucide-react'

type Ticket = {
  id: string
  ticketNumber: string
  subject: string
  priority: string
  status: string
  assigneeName?: string
  requesterName?: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-300',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300',
  RESOLVED: 'bg-green-500/20 text-green-300',
  CLOSED: 'bg-neutral-500/20 text-neutral-300',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-neutral-400',
  MEDIUM: 'text-blue-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
}

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets?limit=100')
      if (res.ok) {
        const d = await res.json()
        setTickets(d.tickets || [])
        setStats(d.stats || {})
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = tickets
    if (filter !== 'ALL') list = list.filter(t => t.status === filter)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t =>
        t.subject.toLowerCase().includes(s) ||
        t.ticketNumber.toLowerCase().includes(s) ||
        (t.requesterName || '').toLowerCase().includes(s)
      )
    }
    return list
  }, [tickets, filter, search])

  const createTicket = async () => {
    if (!newSubject.trim()) return
    setCreating(true)
    setMsg('')
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          description: newDescription.trim(),
          priority: newPriority,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setNewSubject('')
        setNewDescription('')
        setNewPriority('MEDIUM')
        setMsg('Ticket created')
        load()
      } else {
        setMsg(d.error || 'Failed to create')
      }
    } catch (e: any) {
      setMsg(e.message)
    }
    setCreating(false)
  }

  const totalOpen = (stats.OPEN || 0) + (stats.IN_PROGRESS || 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LifeBuoy className="w-8 h-8 text-blue-400" /> Helpdesk
            </h1>
            <p className="text-slate-400">Customer support tickets & knowledge base</p>
          </div>
          <div className="flex gap-2">
            <Link href="/wavecore-erp/helpdesk/sla" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> SLA
            </Link>
            <Link href="/wavecore-erp/helpdesk/knowledge-base" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Knowledge Base
            </Link>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          </div>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">{msg}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-xs text-blue-300 uppercase tracking-wide">Open</p>
            <p className="text-3xl font-bold text-blue-400">{stats.OPEN || 0}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <p className="text-xs text-yellow-300 uppercase tracking-wide">In Progress</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.IN_PROGRESS || 0}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <p className="text-xs text-green-300 uppercase tracking-wide">Resolved</p>
            <p className="text-3xl font-bold text-green-400">{stats.RESOLVED || 0}</p>
          </div>
          <div className="bg-neutral-500/10 border border-neutral-500/30 rounded-2xl p-4">
            <p className="text-xs text-neutral-300 uppercase tracking-wide">Closed</p>
            <p className="text-3xl font-bold text-neutral-400">{stats.CLOSED || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
            />
          </div>
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={'px-3 py-2 rounded-xl text-sm ' + (filter === f ? 'bg-blue-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white')}
            >
              {f === 'ALL' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <LifeBuoy className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No tickets {filter !== 'ALL' ? `with status ${filter}` : 'yet'}</p>
              <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium">
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filtered.map(t => (
                <Link key={t.id} href={'/wavecore-erp/helpdesk/tickets/' + t.id} className="block p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{t.ticketNumber}</span>
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[t.status] || 'bg-slate-500/20 text-slate-300')}>
                          {t.status.replace('_', ' ')}
                        </span>
                        <span className={'text-xs font-bold ' + (PRIORITY_COLORS[t.priority] || 'text-slate-400')}>
                          {t.priority}
                        </span>
                      </div>
                      <p className="font-medium text-white truncate">{t.subject}</p>
                      <div className="flex gap-3 text-xs text-slate-500 mt-1">
                        {t.requesterName && <span>From: {t.requesterName}</span>}
                        {t.assigneeName && <span>Assigned: {t.assigneeName}</span>}
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Create Ticket</h2>
              <input
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-3"
              />
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-3"
              />
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white mb-4"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl">Cancel</button>
                <button onClick={createTicket} disabled={creating || !newSubject.trim()} className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}