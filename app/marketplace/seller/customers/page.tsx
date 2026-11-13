'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Users, Search, ShoppingBag, MessageCircle, User } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [summary, setSummary] = useState({ uniqueCustomers: 0, repeatCustomers: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'REPEAT'>('ALL')
  const [search, setSearch] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const url = `/api/marketplace/seller/customers?filter=${filter}&search=${encodeURIComponent(search)}`
      const res = await fetch(url)
      if (res.ok) {
        const d = await res.json()
        setCustomers(d.customers || [])
        setSummary(d.summary || { uniqueCustomers: 0, repeatCustomers: 0 })
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [filter])

  const repeatCount = customers.filter(c => c.totalOrders >= 2).length

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace/seller/dashboard" className="flex items-center gap-2 font-bold">
              <ChevronLeft className="w-5 h-5" /> Back
            </Link>
            <span className="text-neutral-700">|</span>
            <span className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> My Customers
            </span>
          </div>
          <Link href="/marketplace/seller/reports" className="text-xs text-cyan-400 hover:text-cyan-300">Reports →</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6 space-y-4">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white">
            <User className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.uniqueCustomers}</p>
            <p className="text-xs opacity-80">Total Customers</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white">
            <ShoppingBag className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{repeatCount}</p>
            <p className="text-xs opacity-80">Repeat Customers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {['ALL', 'REPEAT'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === f ? 'bg-cyan-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {f === 'ALL' ? 'All Customers' : 'Repeat Customers'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchCustomers()}
              placeholder="Search name or email... (press Enter)"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">No customers yet</p>
            <p className="text-sm text-neutral-500">Customers who buy from you will appear here</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-2 p-3 border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
              <div className="col-span-4">Customer</div>
              <div className="col-span-2 text-center">Orders</div>
              <div className="col-span-2 text-right">Total Spent</div>
              <div className="col-span-2 text-right">Last Order</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-neutral-800">
              {customers.map(c => (
                <div key={c.buyerId} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 items-center hover:bg-neutral-800/50">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      {c.buyerImage ? (
                        <img src={c.buyerImage} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{c.buyerName || 'Customer'}</p>
                      <p className="text-xs text-neutral-500 truncate">{c.buyerEmail || '—'}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 md:text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.totalOrders >= 2 ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-700 text-neutral-400'}`}>
                      {c.totalOrders} order{c.totalOrders !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="md:col-span-2 md:text-right font-bold text-green-400 text-sm">
                    KES {Number(c.totalSpent).toLocaleString()}
                  </div>
                  <div className="md:col-span-2 md:text-right text-xs text-neutral-500">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="md:col-span-2 md:text-right flex md:justify-end gap-1">
                    <Link
                      href="/marketplace/inbox"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                      title="Message"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}