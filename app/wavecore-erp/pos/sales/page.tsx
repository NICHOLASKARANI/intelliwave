'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Search, Receipt, Banknote, Smartphone, CreditCard, TrendingUp } from 'lucide-react'

type Sale = {
  id: string
  receiptNumber: string
  total: number
  subtotal: number
  taxAmount: number
  paymentMethod: string
  paymentReference?: string
  createdAt: string
  items?: Array<{ productName: string; quantity: number; unitPrice: number }>
}

export default function SalesPage() {
  const [orgId, setOrgId] = useState('')
  const [sales, setSales] = useState<Sale[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [count, setCount] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const cookies = document.cookie.split(';').reduce((acc: any, c) => {
      const [k, v] = c.trim().split('=')
      acc[k] = decodeURIComponent(v || '')
      return acc
    }, {})
    const o = cookies['wavecore_organizationId'] || cookies['organizationId'] || ''
    setOrgId(o)
    if (o) load(o, '', '')
  }, [])

  const load = (org: string, fromDate: string, toDate: string) => {
    const params = new URLSearchParams({ organizationId: org, limit: '200' })
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    fetch('/api/wavecore/pos/sales?' + params.toString())
      .then(r => r.json())
      .then(d => {
        if (d.sales) setSales(d.sales)
        if (typeof d.totalAmount === 'number') setTotalAmount(d.totalAmount)
        if (typeof d.count === 'number') setCount(d.count)
      })
      .catch(() => {})
  }

  const filtered = useMemo(() => {
    if (!search) return sales
    const s = search.toLowerCase()
    return sales.filter(x => x.receiptNumber.toLowerCase().includes(s) || (x.paymentReference || '').toLowerCase().includes(s))
  }, [sales, search])

  const exportCsv = () => {
    const rows = [['Receipt', 'Date', 'Method', 'Reference', 'Subtotal', 'Tax', 'Total']]
    filtered.forEach(s => {
      rows.push([s.receiptNumber, new Date(s.createdAt).toISOString(), s.paymentMethod, s.paymentReference || '', String(s.subtotal), String(s.taxAmount), String(s.total)])
    })
    const csv = rows.map(r => r.map(x => '"' + x.replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pos-sales-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  const methodIcon = (m: string) => {
    if (m === 'CASH') return <Banknote className="w-4 h-4 text-green-400" />
    if (m === 'MPESA') return <Smartphone className="w-4 h-4 text-blue-400" />
    return <CreditCard className="w-4 h-4 text-purple-400" />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/wavecore-erp/pos" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to POS
          </Link>
          <h1 className="text-3xl font-bold">Sales History</h1>
          <p className="text-slate-400">All POS transactions with export to CSV</p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <TrendingUp className="w-3 h-3" /> Total Sales
            </div>
            <p className="text-2xl font-bold">KSh {totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Receipt className="w-3 h-3" /> Transactions
            </div>
            <p className="text-2xl font-bold">{count}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <TrendingUp className="w-3 h-3" /> Average
            </div>
            <p className="text-2xl font-bold">KSh {count > 0 ? Math.round(totalAmount / count).toLocaleString() : 0}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-4">
          <div className="grid md:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt..." className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            <div className="flex gap-2">
              <button onClick={() => orgId && load(orgId, from, to)} className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium">
                Filter
              </button>
              <button onClick={exportCsv} className="px-3 py-2 bg-green-500 hover:bg-green-400 rounded-xl text-sm font-medium flex items-center gap-1">
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No sales yet. Ring up your first sale from POS.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr className="text-left text-slate-400">
                    <th className="p-4">Receipt</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Reference</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-t border-slate-800">
                      <td className="p-4 font-mono text-xs">{s.receiptNumber}</td>
                      <td className="p-4">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1">
                          {methodIcon(s.paymentMethod)} {s.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{s.paymentReference || '—'}</td>
                      <td className="p-4 text-right font-bold text-green-400">KSh {s.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}