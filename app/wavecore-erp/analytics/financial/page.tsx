'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, Loader2, Download, RefreshCw, BarChart3, PieChart, LineChart } from 'lucide-react'

export default function FinancialAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState<any>({})

  useEffect(() => {
    fetchFinancialData()
  }, [period])

  const fetchFinancialData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wavecore/analytics?period=${period}`)
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Failed to fetch financial data')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Financial Analytics - ${period}</title>
      <style>body{font-family:Arial;padding:40px}h1{color:#333;border-bottom:3px solid #059669}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#059669;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}</style>
      </head><body>
      <h1>Financial Analytics - ${period.toUpperCase()}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
      <tr><td>Total Revenue</td><td>KSh ${(data.totalRevenue || 0).toLocaleString()}</td></tr>
      <tr><td>Total Expenses</td><td>KSh ${(data.totalExpenses || 0).toLocaleString()}</td></tr>
      <tr><td>Net Profit</td><td>KSh ${(data.netProfit || 0).toLocaleString()}</td></tr>
      </tbody></table>
      <script>window.print()</script></body></html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Financial Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" /> Financial Analytics
          </h1>
          <div className="flex gap-2">
            <div className="flex rounded-xl border overflow-hidden">
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm capitalize ${period === p ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
              <TrendingUp className="w-6 h-6 text-green-500 mb-3" />
              <p className="text-3xl font-bold">KSh {(data.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            </div>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
              <TrendingDown className="w-6 h-6 text-red-500 mb-3" />
              <p className="text-3xl font-bold">KSh {(data.totalExpenses || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Expenses</p>
            </div>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
              <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
              <p className="text-3xl font-bold">KSh {(data.netProfit || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Net Profit</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}