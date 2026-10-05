'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, BarChart3, CheckCircle2, AlertTriangle } from 'lucide-react'

interface TBRow {
  accountId: string
  code: string
  name: string
  type: string
  debit: number
  credit: number
}

export default function TrialBalancePage() {
  const [rows, setRows] = useState<TBRow[]>([])
  const [totalDebit, setTotalDebit] = useState(0)
  const [totalCredit, setTotalCredit] = useState(0)
  const [balanced, setBalanced] = useState(true)
  const [difference, setDifference] = useState(0)
  const [loading, setLoading] = useState(true)
  const [asOf, setAsOf] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const url = '/api/wavecore/finance/gl/trial-balance-real' + (asOf ? '?asOf=' + asOf : '')
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setRows(data.rows || [])
      setTotalDebit(Number(data.totalDebit || 0))
      setTotalCredit(Number(data.totalCredit || 0))
      setBalanced(Boolean(data.balanced))
      setDifference(Number(data.difference || 0))
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [asOf])

  const formatKES = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = () => {
    let csv = 'Code,Account Name,Type,Debit,Credit\n'
    rows.forEach(r => {
      csv += `${r.code},"${r.name}",${r.type},${r.debit},${r.credit}\n`
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

  const nonZeroRows = rows.filter(r => r.debit !== 0 || r.credit !== 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-500">Trial Balance</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-neutral-500">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Trial Balance</h1>
            <p className="text-sm text-neutral-500 mt-1">Real balances derived from POSTED journal entries.</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">As of</label>
              <input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm"
              />
            </div>
            <button onClick={handleExport} disabled={rows.length === 0} className="mt-4 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Balance indicator */}
        <div className={`p-4 rounded-2xl border mb-6 flex items-center justify-between ${balanced ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'}`}>
          <div className="flex items-center gap-3">
            {balanced ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <div>
              <p className="text-sm font-bold">Total Debits: {formatKES(totalDebit)}</p>
              <p className="text-sm font-bold">Total Credits: {formatKES(totalCredit)}</p>
            </div>
          </div>
          <p className={`font-bold ${balanced ? 'text-green-600' : 'text-red-600'}`}>
            {balanced ? 'Balanced' : 'Out by ' + formatKES(difference)}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : nonZeroRows.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {nonZeroRows.map(r => (
                    <tr key={r.accountId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{r.type}</span>
                      </td>
                      <td className="px-4 py-2 text-right">{r.debit ? formatKES(r.debit) : '—'}</td>
                      <td className="px-4 py-2 text-right">{r.credit ? formatKES(r.credit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50 dark:bg-neutral-800/30">
                  <tr className="font-bold">
                    <td colSpan={3} className="px-4 py-3 text-right">Totals</td>
                    <td className="px-4 py-3 text-right">{formatKES(totalDebit)}</td>
                    <td className="px-4 py-3 text-right">{formatKES(totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No journal activity yet</p>
            <p className="text-sm text-neutral-500 mt-1">Create and POST journal entries to see your trial balance.</p>
          </div>
        )}
      </main>
    </div>
  )
}