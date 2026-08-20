'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Download, Loader2, Edit3, Trash2 } from 'lucide-react'

export default function QualityPage() {
  const [checks, setChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/manufacturing/quality')
      .then(r => r.json())
      .then(d => setChecks(d.checks || d.quality || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Quality Control', '='.repeat(50), `Checks: ${checks.length}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'quality.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Quality</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-500" /> Quality Control ({checks.length})</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {checks.map((c: any, i: number) => (
              <div key={c.id || i} className="flex justify-between p-4 border-b">
                <span className="font-medium">{c.name || `Check ${i+1}`}</span>
                <span className="text-green-600">✓ Pass</span>
              </div>
            ))}
            {checks.length === 0 && <p className="text-center py-8 text-muted-foreground">No quality checks</p>}
          </div>
        )}
      </main>
    </div>
  )
}