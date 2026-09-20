'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  HeadphonesIcon, Ticket, BookOpen, BarChart3, MessageSquare,
  Download, Loader2, Plus, CheckCircle, Clock, TrendingUp,
  Bot, Star, Users, FileText, RefreshCw, AlertTriangle, Zap,
  ArrowUpRight, Timer, Shield, Activity, Target,
} from 'lucide-react'

export default function HelpdeskPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = () => {
    setLoading(true)
    fetch('/api/wavecore/helpdesk/tickets')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchAll() }, [])

  const summary = data.summary || {}
  const tickets = data.tickets || []

  // Distribution by status
  const byStatus = useMemo(() => {
    const m: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, PENDING: 0, RESOLVED: 0, CLOSED: 0 }
    for (const t of tickets) m[t.status] = (m[t.status] || 0) + 1
    return m
  }, [tickets])

  // Distribution by priority
  const byPriority = useMemo(() => {
    const m: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
    for (const t of tickets) m[t.priority] = (m[t.priority] || 0) + 1
    return m
  }, [tickets])

  // Recent tickets (top 5)
  const recent = useMemo(() => {
    return [...tickets].slice(0, 5)
  }, [tickets])

  const handleDownloadPDF = () => window.open('/api/wavecore/helpdesk/tickets/pdf', '_blank')

  const modules = [
    { name: 'Tickets', href: '/wavecore-erp/helpdesk/tickets', icon: Ticket, color: 'from-blue-500 to-indigo-600', stat: summary.total || 0, sub: (summary.open || 0) + ' open' },
    { name: 'Knowledge Base', href: '/wavecore-erp/helpdesk/knowledge-base', icon: BookOpen, color: 'from-purple-500 to-violet-600', stat: '—', sub: 'articles' },
    { name: 'SLA Policies', href: '/wavecore-erp/helpdesk/sla', icon: BarChart3, color: 'from-green-500 to-emerald-600', stat: summary.slaComplianceRate || 100, sub: '% compliance' },
    { name: 'Live Chat', href: '/wavecore-erp/helpdesk/chat', icon: MessageSquare, color: 'from-amber-500 to-orange-600', stat: '—', sub: 'real-time' },
    { name: 'Reports', href: '/wavecore-erp/helpdesk/reports', icon: TrendingUp, color: 'from-pink-500 to-rose-600', stat: '—', sub: 'analytics' },
    { name: 'AI Classify', href: '/wavecore-erp/helpdesk/ai-classification', icon: Bot, color: 'from-violet-500 to-purple-600', stat: '—', sub: 'auto-triage' },
    { name: 'CSAT', href: '/wavecore-erp/helpdesk/csat', icon: Star, color: 'from-amber-500 to-yellow-600', stat: summary.avgCsat || 0, sub: (summary.csatCount || 0) + ' rated' },
    { name: 'Agents', href: '/wavecore-erp/helpdesk/agents', icon: Users, color: 'from-cyan-500 to-blue-600', stat: summary.unassigned || 0, sub: 'unassigned' },
    { name: 'Templates', href: '/wavecore-erp/helpdesk/templates', icon: FileText, color: 'from-teal-500 to-emerald-600', stat: '—', sub: 'canned' },
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk & Support</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* HERO */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-700 p-6 lg:p-8 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <HeadphonesIcon className="w-8 h-8" /> Helpdesk Command Center
              </h1>
              <p className="text-white/80 text-sm">9 modules · Live ticket queue · SLA tracking · CSAT analytics</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <Download className="w-4 h-4" /> PDF
              </button>
              <Link href="/wavecore-erp/helpdesk/tickets/create" className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-pink-700 text-sm font-bold shadow-lg">
                <Plus className="w-4 h-4" /> New Ticket
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : (
          <>
            {/* 7 KPI CARDS */}
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Ticket Queue</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
              <Link href="/wavecore-erp/helpdesk/tickets" className="p-4 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg hover:scale-105 transition-all">
                <Ticket className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
              </Link>
              <Link href="/wavecore-erp/helpdesk/tickets?status=OPEN" className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg hover:scale-105 transition-all">
                <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.open || 0}</p><p className="text-xs opacity-90">Open</p>
              </Link>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
                <Timer className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inProgress || 0}</p><p className="text-xs opacity-90">In Progress</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
                <CheckCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.resolvedToday || 0}</p><p className="text-xs opacity-90">Resolved Today</p>
              </div>
              <div className={'p-4 rounded-2xl text-white shadow-lg bg-gradient-to-br ' + (summary.overdue > 0 ? 'from-red-600 to-rose-800' : 'from-slate-600 to-neutral-800')}>
                <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue || 0}</p><p className="text-xs opacity-90">SLA Breaches</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
                <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResponseHours || 0}h</p><p className="text-xs opacity-90">Avg Response</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-800 text-white shadow-lg">
                <Star className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgCsat || 0}<span className="text-sm">/5</span></p><p className="text-xs opacity-90">CSAT</p>
              </div>
            </div>

            {/* DISTRIBUTIONS */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-pink-400 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Tickets by Status
                </h3>
                {tickets.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No tickets yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(byStatus).map(([s, count]) => {
                      const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
                      const colors: Record<string, string> = { OPEN: 'bg-cyan-500', IN_PROGRESS: 'bg-yellow-500', PENDING: 'bg-orange-500', RESOLVED: 'bg-green-500', CLOSED: 'bg-neutral-500' }
                      return (
                        <div key={s}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-400 uppercase font-bold">{s.replace('_', ' ')}</span>
                            <span className="text-white font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div className={(colors[s] || 'bg-pink-500') + ' h-2 rounded-full'} style={{ width: pct + '%' }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-400 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Tickets by Priority
                </h3>
                {tickets.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No tickets yet</p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(byPriority).map(([p, count]) => {
                      const colors: Record<string, string> = { LOW: 'from-neutral-600 to-neutral-800', MEDIUM: 'from-blue-600 to-indigo-800', HIGH: 'from-orange-600 to-red-800', URGENT: 'from-red-600 to-rose-800' }
                      return (
                        <div key={p} className={'p-4 rounded-xl text-center bg-gradient-to-br text-white ' + colors[p]}>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-[10px] uppercase tracking-wide opacity-90 font-bold mt-1">{p}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RECENT TICKETS */}
            {recent.length > 0 && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden mb-8">
                <div className="flex justify-between items-center p-5 border-b border-neutral-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-pink-400" /> Recent Tickets
                  </h3>
                  <Link href="/wavecore-erp/helpdesk/tickets" className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1">
                    View All <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Subject</th>
                      <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Customer</th>
                      <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Priority</th>
                      <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Status</th>
                      <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(t => (
                      <tr key={t.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3 text-white font-medium">{t.subject}</td>
                        <td className="p-3 text-xs text-neutral-400">{t.customerName || '—'}</td>
                        <td className="p-3 text-center">
                          <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (t.priority === 'URGENT' ? 'bg-red-900/40 text-red-300' : t.priority === 'HIGH' ? 'bg-orange-900/40 text-orange-300' : t.priority === 'MEDIUM' ? 'bg-blue-900/40 text-blue-300' : 'bg-neutral-800 text-neutral-400')}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (t.isOverdue ? 'bg-red-900/40 text-red-300' : t.status === 'OPEN' ? 'bg-cyan-900/40 text-cyan-300' : t.status === 'RESOLVED' ? 'bg-green-900/40 text-green-300' : 'bg-neutral-800 text-neutral-400')}>
                            {t.isOverdue ? 'OVERDUE' : t.status}
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs text-neutral-400">{new Date(t.createdAt).toLocaleDateString('en-GB')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODULE GRID */}
            <h2 className="text-xl font-bold mb-4 text-white">Support Modules (9)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-5 rounded-2xl border bg-neutral-900 border-neutral-800 hover:border-pink-600 hover:shadow-2xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm text-white">{module.name}</p>
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
                      <span className="text-lg font-extrabold text-white">{module.stat}</span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{module.sub}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}