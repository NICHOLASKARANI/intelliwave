'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, AlertCircle, RefreshCw, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/wavve-si/DataTable'

interface Order {
  id: string
  number: string
  date: string
  status: string
  subtotal: number
  taxAmount: number
  total: number
  customer_name: string | null
  customer_email: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-500/10 text-amber-400',
  CONFIRMED:  'bg-blue-500/10 text-blue-400',
  PROCESSING: 'bg-purple-500/10 text-purple-400',
  SHIPPED:    'bg-cyan-500/10 text-cyan-400',
  DELIVERED:  'bg-green-500/10 text-green-400',
  CANCELLED:  'bg-red-500/10 text-red-400',
}

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      params.set('limit', '200')
      const res = await fetch(`/api/wavve-si/restaurant/orders?${params}`, { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login'
        return
      }
      if (!res.ok) throw new Error('Failed to load orders')
      const data = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const columns: Column<Order>[] = [
    {
      key: 'number',
      label: 'Order #',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-amber-400">{row.number}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => new Date(row.date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.customer_name || '—'}</p>
          {row.customer_email && <p className="text-xs text-slate-500">{row.customer_email}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_COLORS[row.status] || 'bg-slate-700 text-slate-300'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-green-400">KSh {row.total.toLocaleString()}</span>,
      className: 'text-right',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Orders</h2>
            <p className="text-sm text-slate-400">{total} order{total === 1 ? '' : 's'} total</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/wavve-si/modules/restaurant-hospitality/orders/new" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Order
          </Link>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === s
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Error loading orders</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      <DataTable<Order>
        data={orders}
        columns={columns}
        searchable={true}
        searchKeys={['number', 'customer_name']}
        pageSize={15}
        emptyMessage={statusFilter === 'ALL' ? 'No orders yet. Orders will appear here once created.' : `No ${statusFilter.toLowerCase()} orders.`}
        loading={loading}
      />
    </div>
  )
}