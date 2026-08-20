'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Plus, Download, Loader2, TrendingDown, TrendingUp } from 'lucide-react'

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/finance/summary')
      .then(r => r.json())
      .then(d => setAssets(d.assets || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalValue = assets.reduce((s: number, a: any) => s + (parseFloat(a.value) || 0), 0)
  const totalDepreciation = assets.reduce((s: number, a: any) => s + (parseFloat(a.depreciation) || 0), 0)

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Fixed Assets', '='.repeat(50), `Total Assets: ${assets.length}`, `Total Value: KSh ${totalValue.toLocaleString()}`, `Depreciation: KSh ${totalDepreciation.toLocaleString()}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'assets.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Fixed Assets</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Building2 className="w-7 h-7" /> Fixed Asset Management</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><Building2 className="w-8 h-8 text-teal-500 mb-3" /><p className="text-3xl font-extrabold">{assets.length}</p><p className="text-xs">Assets</p></div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><TrendingUp className="w-8 h-8 text-green-500 mb-3" /><p className="text-3xl font-extrabold">KSh {totalValue.toLocaleString()}</p><p className="text-xs">Total Value</p></div>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              <span>Depreciation: KSh {totalDepreciation.toLocaleString()}</span>
            </div>
          </>
        )}
      </main>
    </div>
  )
}