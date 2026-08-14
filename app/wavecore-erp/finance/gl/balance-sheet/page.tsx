'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BalanceSheetData {
  assets: number
  liabilities: number
  equity: number
  balanced: boolean
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/wavecore/finance/reports/balance-sheet')
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
    const csv = `Item,Amount\nAssets,${data.assets}\nLiabilities,${data.liabilities}\nEquity,${data.equity}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'balance-sheet.csv'
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
            <span className="text-sm">Balance Sheet</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
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
              <span className="font-medium">Assets</span>
              <span className="font-bold">{formatKES(data.assets)}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="font-medium">Liabilities</span>
              <span className="font-bold">{formatKES(data.liabilities)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-medium">Equity</span>
              <span className="font-bold">{formatKES(data.equity)}</span>
            </div>
            <div className="pt-4 border-t text-sm">
              <span className={data.balanced ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {data.balanced ? '✓ Assets = Liabilities + Equity' : '⚠ Not balanced'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Post journal entries to see your balance sheet</p>
          </div>
        )}
      </main>
    </div>
  )
}