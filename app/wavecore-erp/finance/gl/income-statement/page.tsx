'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IncomeStatementData {
  revenue: number
  expenses: number
  netProfit: number
  grossMargin: string
}

export default function IncomeStatementPage() {
  const [data, setData] = useState<IncomeStatementData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/wavecore/finance/reports/income-statement')
        if (res.ok) setData(await res.json())
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`

  const handleExport = () => {
    if (!data) return
    const csv = `Item,Amount\nRevenue,${data.revenue}\nExpenses,${data.expenses}\nNet Profit,${data.netProfit}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'income-statement.csv'
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
            <span className="text-sm">Income Statement</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Income Statement (P&L)</h1>
          {data && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : data ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="font-medium">Revenue</span>
              <span className="font-bold text-green-600">{formatKES(data.revenue)}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="font-medium">Expenses</span>
              <span className="font-bold text-red-600">{formatKES(data.expenses)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-bold">Net Profit</span>
              <span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatKES(data.netProfit)}
              </span>
            </div>
            <div className="pt-4 border-t text-sm text-muted-foreground">
              Gross Margin: {data.grossMargin}%
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Post journal entries to see your income statement</p>
          </div>
        )}
      </main>
    </div>
  )
}