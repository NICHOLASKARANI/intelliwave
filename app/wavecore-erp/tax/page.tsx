'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Percent, Download, Loader2 } from 'lucide-react'

export default function TaxPage() {
  const [taxes, setTaxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/settings/taxes')
      .then(r => r.json())
      .then(d => setTaxes(d.taxes || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Tax Management', '='.repeat(50), `Tax Rates: ${taxes.length}`, '', ...taxes.map((t: any, i) => `${i+1}. ${t.name} - ${t.rate}% (${t.type})`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tax.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Tax</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-orange-600 to-amber-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Percent className="w-7 h-7" /> Tax Management</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {taxes.map((t: any, i: number) => (
              <div key={t.id || i} className="flex justify-between p-4 border-b">
                <span className="font-medium">{t.name}</span>
                <span className="font-bold text-orange-600">{t.rate}%</span>
              </div>
            ))}
            {taxes.length === 0 && <p className="text-center py-8 text-muted-foreground">No tax rates</p>}
          </div>
        )}
      </main>
    </div>
  )
}