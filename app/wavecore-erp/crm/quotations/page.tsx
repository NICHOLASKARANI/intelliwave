'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Download, ArrowLeft, FileText, Loader2 } from 'lucide-react'

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const res = await fetch('/api/wavecore/crm/quotations')
        if (res.ok) {
          const data = await res.json()
          setQuotations(data.quotations || [])
        }
      } catch {} finally { setLoading(false) }
    }
    fetchQuotations()
  }, [])


  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Quotations',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise ERP',
      '='.repeat(50),
      '',
      ...quotations.map((q: any, i: number) => 
        'Record #' + (i + 1) + '\n' +
        '  Quotation Number: ' + (q.number || 'N/A') + '\n' +
        '  Customer: ' + (q.customer || 'N/A') + '\n' +
        '  Total: ' + (q.total || 'N/A') + '\n' +
        '-'.repeat(30)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')

    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quotations.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Quotations</span>
          </div>
          <Link href="/wavecore-erp/crm" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> CRM
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Quotations</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Download className="w-4 h-4" /> Download PDF</button>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : quotations.length > 0 ? (
          <div className="space-y-3">
            {quotations.map((q) => (
              <div key={q.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900">
                <p className="font-medium">{q.number}</p>
                <p className="text-sm text-muted-foreground">{q.status} - KSh {q.total}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No quotations yet</p>
          </div>
        )}
      </main>
    </div>
  )
}