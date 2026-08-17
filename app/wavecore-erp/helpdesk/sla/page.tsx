'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Timer, TrendingUp, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SLAPage() {
  const [slaStats] = useState({
    avgResponseTime: 0,
    avgResolutionTime: 0,
    slaCompliance: 0,
    breached: 0,
  })

  const formatMinutes = (mins: number) => mins === 0 ? '0m' : `${mins}m`

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">SLA Reports</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Timer className="w-6 h-6 text-orange-500" /> SLA Reports</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatMinutes(slaStats.avgResponseTime)}</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <Timer className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatMinutes(slaStats.avgResolutionTime)}</p>
            <p className="text-xs text-muted-foreground">Avg Resolution</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{slaStats.slaCompliance}%</p>
            <p className="text-xs text-muted-foreground">SLA Compliance</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{slaStats.breached}</p>
            <p className="text-xs text-muted-foreground">Breached</p>
          </div>
        </div>

        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">SLA data will appear as tickets are resolved</p>
        </div>
      </main>
    </div>
  )
}