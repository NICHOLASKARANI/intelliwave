'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Download, Star, TrendingUp } from 'lucide-react'

export default function AgentsPage() {
  const [agents] = useState([
    { name: 'Alice Wanjiru', tickets: 145, resolution: '98%', rating: 4.9 },
    { name: 'Brian Otieno', tickets: 132, resolution: '96%', rating: 4.7 },
    { name: 'Carol Muthoni', tickets: 128, resolution: '97%', rating: 4.8 },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Agent Performance', '='.repeat(50), '', ...agents.map((a, i) => `${i+1}. ${a.name} - ${a.tickets} tickets - ${a.resolution} resolution - ${a.rating}★`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'agents.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Agents</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-500" /> Agent Performance</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="space-y-3">
          {agents.map(agent => (
            <div key={agent.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
              <div>
                <p className="font-bold">{agent.name}</p>
                <p className="text-sm text-muted-foreground">{agent.tickets} tickets resolved</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{agent.resolution}</p>
                <p className="text-sm flex items-center gap-1"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {agent.rating}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}