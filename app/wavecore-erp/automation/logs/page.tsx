'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Activity, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LogsPage() {
  const [logs] = useState([
    { id: '1', workflow: 'Invoice Approval', status: 'SUCCESS', duration: '1.2s', date: new Date().toISOString() },
    { id: '2', workflow: 'Low Stock Alert', status: 'SUCCESS', duration: '0.8s', date: new Date().toISOString() },
    { id: '3', workflow: 'Welcome Email', status: 'FAILED', duration: '2.1s', date: new Date().toISOString() },
  ])
  const [search, setSearch] = useState('')

  const filtered = logs.filter(l => l.workflow?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Execution Logs</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Activity className="w-6 h-6 text-orange-500" /> Execution Logs</h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search logs..." />
        </div>
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
              <div><p className="font-medium">{l.workflow}</p><p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleString()}</p></div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${l.status === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{l.status}</span>
                <span className="text-xs text-muted-foreground">{l.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}