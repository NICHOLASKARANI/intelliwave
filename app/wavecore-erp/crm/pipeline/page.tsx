'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, Loader2, TrendingUp } from 'lucide-react'

export default function PipelinePage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/crm/pipeline')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stages = [
    { name: 'Lead', count: 0, color: 'bg-blue-500' },
    { name: 'Qualified', count: 0, color: 'bg-cyan-500' },
    { name: 'Proposal', count: 0, color: 'bg-purple-500' },
    { name: 'Negotiation', count: 0, color: 'bg-amber-500' },
    { name: 'Closed Won', count: 0, color: 'bg-green-500' },
  ]

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Sales Pipeline', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', ...stages.map(s => `${s.name}: ${s.count} deals`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'pipeline.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Pipeline</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-500" /> Sales Pipeline</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="space-y-4">
            {stages.map(stage => (
              <div key={stage.name} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <span className="font-medium flex-1">{stage.name}</span>
                <span className="font-bold">{stage.count}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}