'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuditLogsPage() {
  const [logs] = useState([
    { id: '1', action: 'User Login', user: 'admin@wavecore.com', date: new Date().toISOString(), ip: '192.168.1.1' },
    { id: '2', action: 'Invoice Created', user: 'finance@wavecore.com', date: new Date().toISOString(), ip: '192.168.1.2' },
    { id: '3', action: 'Settings Updated', user: 'admin@wavecore.com', date: new Date().toISOString(), ip: '192.168.1.1' },
  ])
  const [search, setSearch] = useState('')

  const filtered = logs.filter(l => l.action.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase()))

  const handleExport = () => {
    const csv = 'Action,User,Date,IP\n' + filtered.map(l => `${l.action},${l.user},${l.date},${l.ip}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audit-logs.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Audit Logs</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-emerald-500" /> Audit Logs</h1>
          <Button onClick={handleExport} variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search audit logs..." />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {filtered.map(l => (
            <div key={l.id} className="flex justify-between p-4 border-b hover:bg-neutral-50">
              <div>
                <p className="font-medium">{l.action}</p>
                <p className="text-xs text-muted-foreground">{l.user}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{l.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}