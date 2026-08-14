'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, FileText, BarChart3, TrendingUp, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrialBalanceData {
  accounts: Array<{ code: string; name: string; total_debit: number; total_credit: number }>
  totals: { totalDebit: number; totalCredit: number; balanced: boolean }
}

interface IncomeStatementData {
  revenue: number
  expenses: number
  netProfit: number
  grossMargin: string
}

interface BalanceSheetData {
  assets: number
  liabilities: number
  equity: number
  balanced: boolean
}

export default function ReportsPage() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null)
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      try {
        const [tbRes, isRes, bsRes] = await Promise.all([
          fetch('/api/wavecore/gl/trial-balance'),
          fetch('/api/wavecore/finance/reports/income-statement'),
          fetch('/api/wavecore/finance/reports/balance-sheet'),
        ])

        if (tbRes.ok) setTrialBalance(await tbRes.json())
        if (isRes.ok) setIncomeStatement(await isRes.json())
        if (bsRes.ok) setBalanceSheet(await bsRes.json())
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`

  const exportReport = async (type: string) => {
    const endpoint = type === 'trial-balance' 
      ? '/api/wavecore/gl/trial-balance'
      : type === 'income-statement'
      ? '/api/wavecore/finance/reports/income-statement'
      : '/api/wavecore/finance/reports/balance-sheet'

    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        const csv = jsonToCSV(data, type)
        downloadCSV(csv, `${type}.csv`)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const jsonToCSV = (data: any, type: string): string => {
    let csv = ''
    if (type === 'trial-balance') {
      csv = 'Code,Account Name,Debit,Credit\n'
      data.accounts?.forEach((acc: any) => {
        csv += `${acc.code},${acc.name},${acc.total_debit},${acc.total_credit}\n`
      })
      csv += `TOTAL,,${data.totals?.totalDebit},${data.totals?.totalCredit}`
    } else if (type === 'income-statement') {
      csv = 'Item,Amount\n'
      csv += `Revenue,${data.revenue}\n`
      csv += `Expenses,${data.expenses}\n`
      csv += `Net Profit,${data.netProfit}`
    } else {
      csv = 'Item,Amount\n'
      csv += `Assets,${data.assets}\n`
      csv += `Liabilities,${data.liabilities}\n`
      csv += `Equity,${data.equity}`
    }
    return csv
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
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
            <span className="text-sm">Financial Reports</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Financial Reports</h1>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Trial Balance */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                <h3 className="font-bold">Trial Balance</h3>
              </div>
              {trialBalance ? (
                <>
                  <p className="text-sm mb-2">Total Debit: <span className="font-bold">{formatKES(trialBalance.totals?.totalDebit || 0)}</span></p>
                  <p className="text-sm mb-2">Total Credit: <span className="font-bold">{formatKES(trialBalance.totals?.totalCredit || 0)}</span></p>
                  <p className={`text-sm mb-4 ${trialBalance.totals?.balanced ? 'text-green-600' : 'text-red-600'}`}>
                    {trialBalance.totals?.balanced ? '✓ Balanced' : '⚠ Not Balanced'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => exportReport('trial-balance')} className="gap-1">
                    <Download className="w-3 h-3" /> Export CSV
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>

            {/* Income Statement */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <h3 className="font-bold">Income Statement</h3>
              </div>
              {incomeStatement ? (
                <>
                  <p className="text-sm mb-2">Revenue: <span className="font-bold">{formatKES(incomeStatement.revenue || 0)}</span></p>
                  <p className="text-sm mb-2">Expenses: <span className="font-bold">{formatKES(incomeStatement.expenses || 0)}</span></p>
                  <p className="text-sm mb-4">Net Profit: <span className={`font-bold ${(incomeStatement.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatKES(incomeStatement.netProfit || 0)}</span></p>
                  <Button variant="outline" size="sm" onClick={() => exportReport('income-statement')} className="gap-1">
                    <Download className="w-3 h-3" /> Export CSV
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>

            {/* Balance Sheet */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-purple-500" />
                <h3 className="font-bold">Balance Sheet</h3>
              </div>
              {balanceSheet ? (
                <>
                  <p className="text-sm mb-2">Assets: <span className="font-bold">{formatKES(balanceSheet.assets || 0)}</span></p>
                  <p className="text-sm mb-2">Liabilities: <span className="font-bold">{formatKES(balanceSheet.liabilities || 0)}</span></p>
                  <p className="text-sm mb-2">Equity: <span className="font-bold">{formatKES(balanceSheet.equity || 0)}</span></p>
                  <p className={`text-sm mb-4 ${balanceSheet.balanced ? 'text-green-600' : 'text-red-600'}`}>
                    {balanceSheet.balanced ? '✓ Balanced' : '⚠ Not Balanced'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => exportReport('balance-sheet')} className="gap-1">
                    <Download className="w-3 h-3" /> Export CSV
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}