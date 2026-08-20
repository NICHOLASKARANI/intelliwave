'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Warehouse, Plus, Download, Loader2 } from 'lucide-react'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/inventory/warehouses')
      .then(r => r.json())
      .then(d => setWarehouses(d.warehouses || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Warehouses', '='.repeat(50), `Total: ${warehouses.length}`, '', ...warehouses.map((w, i) => `${i+1}. ${w.name} - ${w.location || 'N/A'}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'warehouses.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Warehouses</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Warehouse className="w-6 h-6 text-blue-500" /> Warehouses ({warehouses.length})</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid md:grid-cols-2 gap-4">
            {warehouses.map(w => (
              <div key={w.id} className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Warehouse className="w-8 h-8 text-blue-500 mb-3" />
                <p className="font-bold text-lg">{w.name}</p>
                <p className="text-sm text-muted-foreground">{w.location || 'No location'}</p>
              </div>
            ))}
            {warehouses.length === 0 && <p className="col-span-2 text-center py-8 text-muted-foreground">No warehouses</p>}
          </div>
        )}
      </main>
    </div>
  )
}