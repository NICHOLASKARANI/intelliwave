'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  HeadphonesIcon, Ticket, BookOpen, BarChart3, MessageSquare,
  Download, Loader2, Plus, CheckCircle, Clock, TrendingUp
} from 'lucide-react'

export default function HelpdeskPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/helpdesk/tickets')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Helpdesk Dashboard',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Total Tickets: ' + (data.tickets?.length || 0),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'helpdesk.pdf'; a.click()
  }

  const modules = [
    { name: 'Tickets', href: '/wavecore-erp/helpdesk/tickets', icon: Ticket, color: 'from-blue-500 to-indigo-600', desc: 'Manage tickets' },
    { name: 'Knowledge Base', href: '/wavecore-erp/helpdesk/knowledge-base', icon: BookOpen, color: 'from-purple-500 to-violet-600', desc: 'Articles & guides' },
    { name: 'SLA Reports', href: '/wavecore-erp/helpdesk/sla', icon: BarChart3, color: 'from-green-500 to-emerald-600', desc: 'Service levels' },
    { name: 'Live Chat', href: '/wavecore-erp/helpdesk/chat', icon: MessageSquare, color: 'from-amber-500 to-orange-600', desc: 'Real-time support' },
    { name: 'Reports', href: '/wavecore-erp/helpdesk/reports', icon: TrendingUp, color: 'from-pink-500 to-rose-600', desc: 'Analytics' },
  ]

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
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <HeadphonesIcon className="w-8 h-8" /> Helpdesk & Support
              </h1>
              <p className="text-white/80 text-sm">Tickets • Knowledge Base • SLA • Chat</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
              <Link href="/wavecore-erp/helpdesk/tickets/create" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-pink-700 text-sm font-bold"><Plus className="w-4 h-4" /> Ticket</Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Ticket className="w-8 h-8 text-blue-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.tickets?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-3xl font-extrabold">0</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Clock className="w-8 h-8 text-amber-500 mb-3" />
                <p className="text-3xl font-extrabold">0</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingUp className="w-8 h-8 text-emerald-500 mb-3" />
                <p className="text-3xl font-extrabold">100%</p>
                <p className="text-xs text-muted-foreground">SLA</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Support Modules (5)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-pink-300 hover:shadow-2xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
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