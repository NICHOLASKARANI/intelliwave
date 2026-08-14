'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AccountBalance {
  id: string
  code: string
  name: string
  type: string
  total_debit: number
  total_credit: number
  balance: number
}

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDebit, setTotalDebit] = useState(0)
  const [totalCredit, setTotalCredit] = useState(0)

  useEffect(() => {
    async function fetchTrialBalance() {
      try {
        const res = await fetch('/api/wavecore/gl/trial-balance')
        if (res.ok) {
          const data = await res.json()
          const accountList = data.accounts || []
          setAccounts(accountList)
          setTotalDebit(accountList.reduce((sum: number, a: any) => sum + parseFloat(a.total_debit || '0'), 0))
          setTotalCredit(accountList.reduce((sum: number, a: any) => sum + parseFloat(a.total_credit || '0'), 0))
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchTrialBalance()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleExport = () => {
    let csv = 'Code,Account Name,Type,Debit,Credit\n'
    accounts.forEach(a => {
      csv += `${a.code},"${a.name}",${a.type},${a.total_debit},${a.total_credit}\n`
    })
    csv += `TOTAL,,,${totalDebit},${totalCredit}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trial-balance.csv'
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
            <span className="text-sm">Trial Balance</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Trial Balance</h1>
          {accounts.length > 0 && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )}
        </div>

        {/* Balance Indicator */}
        <div className={`p-4 rounded-2xl border mb-6 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Debits: {formatKES(totalDebit)}</p>
              <p className="text-sm font-medium">Total Credits: {formatKES(totalCredit)}</p>
            </div>
            <p className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? '✓ Balanced' : '⚠ Not Balanced'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Code</th>
                  <th className="text-left p-4">Account</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-right p-4">Debit</th>
                  <th className="text-right p-4">Credit</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-mono">{acc.code}</td>
                    <td className="p-4">{acc.name}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs bg-neutral-100 rounded-full">{acc.type}</span></td>
                    <td className="p-4 text-right">{formatKES(acc.total_debit)}</td>
                    <td className="p-4 text-right">{formatKES(acc.total_credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Post journal entries to see your trial balance</p>
          </div>
        )}
      </main>
    </div>
  )
}