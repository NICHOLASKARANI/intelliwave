'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function APPage() {
  const [payables, setPayables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchAP() {
      try {
        const res = await fetch('/api/wavecore/gl/accounts-receivable')
        if (res.ok) {
          const data = await res.json()
          setPayables(data.receivables || [])
          setTotal((data.receivables || []).reduce((sum: number, r: any) => sum + (r.balance_due || 0), 0))
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchAP()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`


  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Accounts Payable', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ap.pdf'; a.click()
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
            <span className="text-sm">Accounts Payable</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Accounts Payable</h1>

        <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 mb-6">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-3xl font-bold">{formatKES(total)}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : payables.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Invoice #</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Balance Due</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-4 font-medium">{p.number}</td>
                    <td className="p-4">{p.customer_name}</td>
                    <td className="p-4 text-right">{formatKES(p.total)}</td>
                    <td className="p-4 text-right font-bold text-orange-500">{formatKES(p.balance_due)}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payables yet</p>
            <p className="text-sm text-muted-foreground mt-1">Money you owe to suppliers will appear here</p>
          </div>
        )}
      </main>
    </div>
  )
}