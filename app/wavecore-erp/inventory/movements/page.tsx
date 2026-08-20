'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Download, Loader2 } from 'lucide-react'

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/inventory/movements')
      .then(r => r.json())
      .then(d => setMovements(d.movements || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Stock Movements', '='.repeat(50), `Total: ${movements.length}`, '', ...movements.map((m, i) => `${i+1}. ${m.type || 'Movement'} - Qty: ${m.quantity || 0} - ${m.date || ''}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'movements.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Movements</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRight className="w-6 h-6 text-green-500" /> Stock Movements ({movements.length})</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {movements.map((m, i) => (
              <div key={i} className="flex justify-between p-4 border-b">
                <span className="font-medium">{m.type || 'Movement'}</span>
                <span className={m.quantity > 0 ? 'text-green-600' : 'text-red-500'}>{m.quantity || 0}</span>
              </div>
            ))}
            {movements.length === 0 && <p className="text-center py-8 text-muted-foreground">No movements</p>}
          </div>
        )}
      </main>
    </div>
  )
}