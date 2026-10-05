'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp, Loader2 } from 'lucide-react'

interface Line { accountId: string; code: string; name: string; type: string; natural: number }

export default function IncomeStatementPage() {
  const [income, setIncome] = useState<Line[]>([])
  const [expense, setExpense] = useState<Line[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const res = await fetch('/api/wavecore/finance/gl/income-statement-real' + (qs.toString() ? '?' + qs.toString() : ''), { cache: 'no-store' })
      const data = await res.json()
      setIncome(data.income || [])
      setExpense(data.expense || [])
      setTotalIncome(Number(data.totalIncome || 0))
      setTotalExpense(Number(data.totalExpense || 0))
      setNetProfit(Number(data.netProfit || 0))
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [from, to])

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = () => {
    let csv = 'Section,Code,Account,Amount\n'
    income.forEach(l => { csv += `Income,${l.code},"${l.name}",${l.natural}\n` })
    expense.forEach(l => { csv += `Expense,${l.code},"${l.name}",${l.natural}\n` })
    csv += `,,\nTotal Income,,,${totalIncome}\nTotal Expenses,,,${totalExpense}\nNet Profit,,,${netProfit}\n`
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-500">Income Statement (P&amp;L)</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-neutral-500">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Income Statement</h1>
            <p className="text-sm text-neutral-500 mt-1">Profit &amp; Loss from POSTED journal entries.</p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
            </div>
            <button onClick={handleExport} disabled={loading} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : (income.length + expense.length === 0) ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No revenue or expenses yet</p>
            <p className="text-sm text-neutral-500 mt-1">Post journal entries against Income or Expense accounts.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xs uppercase tracking-wide text-green-600 font-bold mb-3">Income</h3>
              <table className="w-full text-sm mb-6">
                <tbody>
                  {income.map(l => (
                    <tr key={l.accountId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="py-2 font-mono text-xs text-neutral-500 w-16">{l.code}</td>
                      <td className="py-2">{l.name}</td>
                      <td className="py-2 text-right font-medium">{fmt(l.natural)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-neutral-200 dark:border-neutral-700">
                    <td></td>
                    <td className="pt-3">Total Income</td>
                    <td className="pt-3 text-right text-green-600">{fmt(totalIncome)}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-xs uppercase tracking-wide text-red-600 font-bold mb-3">Expenses</h3>
              <table className="w-full text-sm mb-6">
                <tbody>
                  {expense.map(l => (
                    <tr key={l.accountId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="py-2 font-mono text-xs text-neutral-500 w-16">{l.code}</td>
                      <td className="py-2">{l.name}</td>
                      <td className="py-2 text-right font-medium">{fmt(l.natural)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-neutral-200 dark:border-neutral-700">
                    <td></td>
                    <td className="pt-3">Total Expenses</td>
                    <td className="pt-3 text-right text-red-600">{fmt(totalExpense)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t-2 border-neutral-900 dark:border-white pt-4 flex justify-between items-center">
                <span className="text-lg font-bold">Net Profit</span>
                <span className={'text-2xl font-bold ' + (netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {fmt(netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}