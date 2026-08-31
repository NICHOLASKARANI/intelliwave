'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ShoppingCart, Loader2, Printer, Trash2, Search, TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react'

interface Sale {
  id: string
  number: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('ALL')
  const [deleting, setDeleting] = useState('')

  const months = ['ALL', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const years = ['ALL', '2024', '2025', '2026', '2027']

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/store/sales')
      const data = await res.json()
      setSales(data.sales || [])
    } catch (err) {
      setError('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const deleteSale = async (id: string) => {
    if (!confirm('Delete this sale?')) return
    setDeleting(id)
    try {
      await fetch(`/api/wavecore/store/sales?id=${id}`, { method: 'DELETE' })
      fetchSales()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/store/sales/${id}/pdf`, '_blank')
  }

  const filtered = sales.filter(sale => {
    const date = new Date(sale.createdAt)
    const monthMatch = selectedMonth === 'ALL' || months[date.getMonth() + 1] === selectedMonth
    const yearMatch = selectedYear === 'ALL' || String(date.getFullYear()) === selectedYear
    const searchMatch = (sale.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (sale.customerName || '').toLowerCase().includes(search.toLowerCase())
    return monthMatch && yearMatch && searchMatch
  })

  const totalSales = filtered.reduce((sum, s) => sum + Number(s.total || 0), 0)
  const today = new Date()
  const todaySales = sales.filter(s => {
    const d = new Date(s.createdAt)
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).reduce((sum, s) => sum + Number(s.total || 0), 0)
  const todayCount = sales.filter(s => {
    const d = new Date(s.createdAt)
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Sales</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-500" /> Sales ({filtered.length})
          </h1>
          <Link href="/wavecore-erp/store/sales/create"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Sale
          </Link>
        </div>

        {/* Stats - Clickable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => { setSelectedMonth('ALL'); setSelectedYear('ALL'); }}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-center hover:shadow-lg transition-all">
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {totalSales.toLocaleString()}</p>
            <p className="text-xs opacity-80">Total Sales</p>
          </button>
          <button onClick={() => { setSelectedMonth(months[today.getMonth() + 1]); setSelectedYear(String(today.getFullYear())); }}
            className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white text-center hover:shadow-lg transition-all">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {todaySales.toLocaleString()}</p>
            <p className="text-xs opacity-80">Today Sales</p>
          </button>
          <button onClick={() => { setSelectedMonth(months[today.getMonth() + 1]); setSelectedYear(String(today.getFullYear())); }}
            className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 text-white text-center hover:shadow-lg transition-all">
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-xs opacity-80">Today Transactions</p>
          </button>
          <button onClick={() => { setSelectedMonth('ALL'); setSelectedYear('ALL'); }}
            className="p-5 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white text-center hover:shadow-lg transition-all">
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs opacity-80">Filtered Sales</p>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-xl border text-sm font-bold">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 rounded-xl border text-sm font-bold">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border w-full" placeholder="Search sales..." />
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No sales found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Sale #</th>
                  <th className="text-left p-4 text-sm">Customer</th>
                  <th className="text-right p-4 text-sm">Total</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Date</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sale => (
                  <tr key={sale.id} className="border-t hover:bg-neutral-50">
                    <td className="p-4 font-mono text-sm">{sale.number}</td>
                    <td className="p-4">{sale.customerName || 'Walk-in'}</td>
                    <td className="p-4 text-right font-bold text-green-600">KSh {Number(sale.total || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {sale.status || 'DELIVERED'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => downloadPdf(sale.id)} title="Download PDF"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteSale(sale.id)} title="Delete"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          {deleting === sale.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}