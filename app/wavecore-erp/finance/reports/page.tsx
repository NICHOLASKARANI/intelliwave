'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Loader2, Printer, BarChart3, TrendingUp, Scale, BookOpen, DollarSign } from 'lucide-react'

interface BalanceSheet {
  assets: number
  liabilities: number
  equity: number
  balanced: boolean
}

interface IncomeStatement {
  revenue: number
  expenses: number
  netProfit: number
  isProfit: boolean
}

interface TrialBalance {
  accounts: any[]
  totalDebit: number
  totalCredit: number
  balanced: boolean
}

export default function FinancialReportsPage() {
  const [activeReport, setActiveReport] = useState('balance-sheet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null)
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null)
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null)

  const fetchReport = async (type: string) => {
    setLoading(true)
    setError('')
    setActiveReport(type)
    
    try {
      if (type === 'balance-sheet') {
        const res = await fetch('/api/wavecore/finance/reports/balance-sheet')
        const data = await res.json()
        setBalanceSheet(data.balanceSheet || null)
      } else if (type === 'income-statement') {
        const res = await fetch('/api/wavecore/finance/reports/income-statement')
        const data = await res.json()
        setIncomeStatement(data.incomeStatement || null)
      } else if (type === 'trial-balance') {
        const res = await fetch('/api/wavecore/finance/reports/trial-balance')
        const data = await res.json()
        setTrialBalance(data.trialBalance || null)
      }
    } catch (err) {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport('balance-sheet')
  }, [])

  const printReport = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Financial Reports</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Financial Reports
          </h1>
          <button onClick={printReport}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {/* Report Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => fetchReport('balance-sheet')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeReport === 'balance-sheet' ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
            <Scale className="w-4 h-4" /> Balance Sheet
          </button>
          <button onClick={() => fetchReport('income-statement')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeReport === 'income-statement' ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
            <TrendingUp className="w-4 h-4" /> Income Statement
          </button>
          <button onClick={() => fetchReport('trial-balance')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeReport === 'trial-balance' ? 'bg-purple-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
            <BookOpen className="w-4 h-4" /> Trial Balance
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            {/* BALANCE SHEET */}
            {activeReport === 'balance-sheet' && balanceSheet && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-center">BALANCE SHEET</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="font-bold text-green-700 mb-3">ASSETS</p>
                    <p className="text-3xl font-bold text-green-600">KSh {balanceSheet.assets.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="font-bold text-red-700 mb-3">LIABILITIES + EQUITY</p>
                    <p className="text-3xl font-bold text-red-600">KSh {(balanceSheet.liabilities + balanceSheet.equity).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-neutral-50">
                    <p className="text-xs text-muted-foreground">Assets</p>
                    <p className="font-bold">KSh {balanceSheet.assets.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-50">
                    <p className="text-xs text-muted-foreground">Liabilities</p>
                    <p className="font-bold">KSh {balanceSheet.liabilities.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-50">
                    <p className="text-xs text-muted-foreground">Equity</p>
                    <p className="font-bold">KSh {balanceSheet.equity.toLocaleString()}</p>
                  </div>
                </div>
                <p className={`text-center mt-4 font-bold ${balanceSheet.balanced ? 'text-green-600' : 'text-red-600'}`}>
                  {balanceSheet.balanced ? '✓ BALANCED' : '⚠ NOT BALANCED'}
                </p>
              </div>
            )}

            {/* INCOME STATEMENT */}
            {activeReport === 'income-statement' && incomeStatement && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-center">INCOME STATEMENT</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                    <p className="font-bold text-green-700 mb-2">REVENUE</p>
                    <p className="text-2xl font-bold text-green-600">KSh {incomeStatement.revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                    <p className="font-bold text-red-700 mb-2">EXPENSES</p>
                    <p className="text-2xl font-bold text-red-600">KSh {incomeStatement.expenses.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-center ${incomeStatement.isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                    <p className="font-bold mb-2">NET {incomeStatement.isProfit ? 'PROFIT' : 'LOSS'}</p>
                    <p className={`text-2xl font-bold ${incomeStatement.isProfit ? 'text-emerald-600' : 'text-orange-600'}`}>
                      KSh {Math.abs(incomeStatement.netProfit).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TRIAL BALANCE */}
            {activeReport === 'trial-balance' && trialBalance && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-center">TRIAL BALANCE</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800">
                        <th className="text-left p-3 text-sm">Code</th>
                        <th className="text-left p-3 text-sm">Account</th>
                        <th className="text-right p-3 text-sm">Debit</th>
                        <th className="text-right p-3 text-sm">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialBalance.accounts.map((acc, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3 text-sm">{acc.code}</td>
                          <td className="p-3 text-sm">{acc.name}</td>
                          <td className="p-3 text-sm text-right">KSh {Number(acc.debit || 0).toLocaleString()}</td>
                          <td className="p-3 text-sm text-right">KSh {Number(acc.credit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50 dark:bg-neutral-800 font-bold">
                        <td className="p-3" colSpan={2}>TOTAL</td>
                        <td className="p-3 text-right">KSh {trialBalance.totalDebit.toLocaleString()}</td>
                        <td className="p-3 text-right">KSh {trialBalance.totalCredit.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className={`text-center mt-4 font-bold ${trialBalance.balanced ? 'text-green-600' : 'text-red-600'}`}>
                  {trialBalance.balanced ? '✓ DEBITS = CREDITS' : '⚠ NOT BALANCED'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}