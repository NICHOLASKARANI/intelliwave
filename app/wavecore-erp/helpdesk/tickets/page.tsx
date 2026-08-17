'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Trash2, Loader2, Inbox, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets')
      if (res.ok) { const data = await res.json(); setTickets(data.tickets || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ticket?')) return
    try { await fetch(`/api/wavecore/helpdesk/tickets/${id}`, { method: 'DELETE' }); fetchTickets() } catch {}
  }

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'ALL' || t.status === filter
    return matchesSearch && matchesFilter
  })

  const statusColors: Record<string, string> = {
    OPEN: 'bg-red-50 text-red-600', IN_PROGRESS: 'bg-blue-50 text-blue-600',
    RESOLVED: 'bg-green-50 text-green-600', CLOSED: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Tickets</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">All Tickets</h1>
          <Link href="/wavecore-erp/helpdesk/tickets/create"><Button className="gap-2 bg-pink-600"><Plus className="w-4 h-4" /> New Ticket</Button></Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search tickets..." />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 rounded-xl border text-sm">
            <option value="ALL">All</option><option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" /></div> :
          filtered.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Subject</th><th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th>
                </tr></thead>
                <tbody>{filtered.map(t => (
                  <tr key={t.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{t.subject}</td>
                    <td className="p-4">{t.priority}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${statusColors[t.status] || ''}`}>{t.status}</span></td>
                    <td className="p-4 text-center"><button onClick={() => handleDelete(t.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No tickets found</p></div>
        }
      </main>
    </div>
  )
}