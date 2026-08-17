'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  HeadphonesIcon, Plus, Search, Clock, CheckCircle, AlertCircle, TrendingUp,
  Users, Inbox, Star, Loader2, MessageSquare, Zap, BarChart3, Globe,
  Phone, Shield, ThumbsUp, Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets')
      if (res.ok) { const data = await res.json(); setTickets(data.tickets || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [])

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    urgent: tickets.filter(t => t.priority === 'URGENT').length,
    high: tickets.filter(t => t.priority === 'HIGH').length,
  }

  const filtered = tickets.filter(t => t.subject?.toLowerCase().includes(search.toLowerCase()))

  const subPages = [
    { label: 'Knowledge Base', href: '/wavecore-erp/helpdesk/knowledge-base', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', desc: 'Articles & FAQs' },
    { label: 'SLA Reports', href: '/wavecore-erp/helpdesk/sla', icon: Timer, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', desc: 'Response time tracking' },
    { label: 'Live Chat', href: '/wavecore-erp/helpdesk/chat', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', desc: 'Real-time support' },
    { label: 'Reports', href: '/wavecore-erp/helpdesk/reports', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', desc: 'Analytics & insights' },
  ]

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700', HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-amber-100 text-amber-700', LOW: 'bg-gray-100 text-gray-700',
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-red-50 text-red-600', IN_PROGRESS: 'bg-blue-50 text-blue-600',
    RESOLVED: 'bg-green-50 text-green-600', CLOSED: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Helpdesk</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <HeadphonesIcon className="w-8 h-8" /> Helpdesk & Support
              </h1>
              <p className="text-white/80 text-sm">Tickets • SLA • Knowledge Base • Live Chat</p>
            </div>
            <div className="hidden lg:block bg-white/20 rounded-2xl px-6 py-3 text-center">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-white/70">Total Tickets</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard label="Total" value={stats.total} icon={Inbox} color="text-blue-500" />
              <KPICard label="Open" value={stats.open} icon={AlertCircle} color="text-red-500" />
              <KPICard label="In Progress" value={stats.inProgress} icon={Clock} color="text-orange-500" />
              <KPICard label="Resolved" value={stats.resolved} icon={CheckCircle} color="text-green-500" />
              <KPICard label="Urgent" value={stats.urgent} icon={Zap} color="text-pink-500" />
              <KPICard label="High" value={stats.high} icon={Star} color="text-amber-500" />
            </div>

            {/* Sub-pages */}
            <h2 className="text-lg font-bold mb-4">Support Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {subPages.map(page => {
                const Icon = page.icon
                return (
                  <Link key={page.label} href={page.href}
                    className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-pink-300 hover:shadow-lg transition-all group">
                    <div className={`w-10 h-10 rounded-xl ${page.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${page.color}`} />
                    </div>
                    <p className="font-medium text-sm">{page.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{page.desc}</p>
                  </Link>
                )
              })}
            </div>

            {/* Search + Create */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search tickets..." />
              </div>
              <Link href="/wavecore-erp/helpdesk/tickets/create">
                <Button className="gap-2 bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4" /> New Ticket</Button>
              </Link>
            </div>

            {/* Tickets Table */}
            {filtered.length > 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                    <th className="text-left p-4">Subject</th>
                    <th className="text-left p-4">Priority</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-center p-4">Replies</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <td className="p-4">
                          <p className="font-medium">{t.subject}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">{t.description}</p>
                        </td>
                        <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${priorityColors[t.priority] || ''}`}>{t.priority}</span></td>
                        <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${statusColors[t.status] || ''}`}>{t.status}</span></td>
                        <td className="p-4 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-center">{t.message_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No tickets yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first support ticket</p>
                <Link href="/wavecore-erp/helpdesk/tickets/create">
                  <Button className="gap-2 bg-pink-600"><Plus className="w-4 h-4" /> Create Ticket</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}