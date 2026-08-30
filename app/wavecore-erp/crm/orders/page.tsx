'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Package, Search, Trash2, Loader2, Printer, DollarSign } from 'lucide-react'

interface SalesOrder {
  id: string
  number: string
  total: number
  amount: number
  status: string
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/orders?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchOrders()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/orders/${id}/pdf`, '_blank')
  }

  const filtered = orders.filter(o => 
    (o.number || '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700'
      case 'SHIPPED': return 'bg-purple-100 text-purple-700'
      case 'DELIVERED': return 'bg-green-100 text-green-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Sales Orders</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-red-500" /> Sales Orders ({orders.length})
          </h1>
          <Link href="/wavecore-erp/crm/orders/create"
            className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search orders..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold">{order.number || 'N/A'}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-red-600 flex items-center gap-1 mt-1">
                    <DollarSign className="w-4 h-4" /> KSh {Number(order.total || order.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(order.id)} title="Download PDF"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteOrder(order.id)} title="Delete"
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    {deleting === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}