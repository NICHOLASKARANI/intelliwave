'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Wallet, Download, Loader2, TrendingUp } from 'lucide-react'

export default function PayrollPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/hr/payroll')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPayroll = data.payroll?.reduce((s: number, p: any) => s + (parseFloat(p.netPay) || 0), 0) || 0

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Payroll', '='.repeat(50), `Total Payroll: KSh ${totalPayroll.toLocaleString()}`, `Employees: ${data.payroll?.length || 0}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'payroll.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Payroll</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6 text-purple-500" /> Payroll</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-8 text-white text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <p className="text-4xl font-extrabold">KSh {totalPayroll.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-2">Total Monthly Payroll ({data.payroll?.length || 0} employees)</p>
          </div>
        )}
      </main>
    </div>
  )
}