'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Ticket, Plus, Search, Download, Loader2, Trash2, CheckCircle, Clock } from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets')
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ticket?')) return
    try { await fetch(`/api/wavecore/helpdesk/tickets?id=${id}`, { method: 'DELETE' }); fetchTickets() } catch {}
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Support Tickets',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Total: ' + filtered.length,
      '='.repeat(50),
      '',
      ...filtered.map((t: any, i) => `Ticket #${i+1}\n  Subject: ${t.subject}\n  Status: ${t.status || 'OPEN'}\n  Priority: ${t.priority || 'MEDIUM'}\n` + '-'.repeat(30)),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tickets.pdf'; a.click()
  }

  const filtered = tickets.filter((t: any) =>
    (t.subject || '').toLowerCase().includes(search.toLowerCase())
  )

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
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket className="w-6 h-6 text-blue-500" /> Tickets ({filtered.length})</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
            <Link href="/wavecore-erp/helpdesk/tickets/create" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm"><Plus className="w-4 h-4" /> New</Link>
          </div>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search tickets..." />
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {filtered.map((t: any) => (
              <div key={t.id} className="flex justify-between items-center p-4 border-b hover:bg-neutral-50">
                <div>
                  <p className="font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.priority || 'MEDIUM'} • {t.status || 'OPEN'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === 'RESOLVED' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
                  <button onClick={() => handleDelete(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No tickets</p>}
          </div>
        )}
      </main>
    </div>
  )
}