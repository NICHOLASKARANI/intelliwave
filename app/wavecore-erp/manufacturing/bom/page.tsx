'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Plus, Download, Loader2, Edit3, Trash2 } from 'lucide-react'

export default function BOMPage() {
  const [boms, setBoms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/manufacturing/bom')
      .then(r => r.json())
      .then(d => setBoms(d.boms || d.bom || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this BOM?')) return
    try { await fetch(`/api/wavecore/manufacturing/bom?id=${id}`, { method: 'DELETE' }) } catch {}
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Bill of Materials', '='.repeat(50), `Total: ${boms.length}`, '', ...boms.map((b: any, i) => `${i+1}. ${b.name || b.code || 'BOM'}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'bom.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">BOM</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-purple-500" /> Bill of Materials ({boms.length})</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {boms.map((b: any, i: number) => (
              <div key={b.id || i} className="flex justify-between p-4 border-b">
                <span className="font-medium">{b.name || b.code || 'BOM'}</span>
                <div className="flex gap-2">
                  <button className="text-blue-500"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(b.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {boms.length === 0 && <p className="text-center py-8 text-muted-foreground">No BOMs</p>}
          </div>
        )}
      </main>
    </div>
  )
}