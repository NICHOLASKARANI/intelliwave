'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, TrendingUp, Clock, CheckCircle, AlertCircle, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HelpdeskReportsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/helpdesk/tickets').then(r => r.json()).then(d => setTickets(d.tickets || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const total = tickets.length
  const open = tickets.filter(t => t.status === 'OPEN').length
  const resolved = tickets.filter(t => t.status === 'RESOLVED').length
  const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const urgent = tickets.filter(t => t.priority === 'URGENT').length
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  const handleExport = () => {
    const csv = 'Subject,Priority,Status,Created\n' + tickets.map(t => `${t.subject},${t.priority},${t.status},${new Date(t.createdAt).toLocaleDateString()}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'helpdesk-report.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Helpdesk Reports</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-500" /> Helpdesk Reports</h1>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{resolved}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{resolutionRate}%</p>
                <p className="text-xs text-muted-foreground">Resolution Rate</p>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4">Ticket Status Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Open', count: open, color: 'bg-red-500' },
                  { label: 'In Progress', count: inProgress, color: 'bg-blue-500' },
                  { label: 'Resolved', count: resolved, color: 'bg-green-500' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="flex-1">{s.label}</span>
                    <span className="font-bold">{s.count}</span>
                    <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}