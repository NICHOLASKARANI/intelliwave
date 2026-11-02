'use client'
import { useEffect, useState } from 'react'
import { Users, AlertCircle, RefreshCw, Mail, Phone, Building2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/wavve-si/DataTable'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  city: string | null
  country: string | null
  status: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  INACTIVE: 'bg-slate-700 text-slate-400',
  PROSPECT: 'bg-amber-500/10 text-amber-400',
  BLOCKED: 'bg-red-500/10 text-red-400',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wavve-si/restaurant/customers?limit=200', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard'
        return
      }
      if (!res.ok) throw new Error('Failed to load customers')
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCustomers() }, [])

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-white font-medium">{row.name}</p>
          {row.company && <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{row.company}</p>}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (row) => (
        <div className="space-y-0.5">
          {row.email && <p className="text-xs text-slate-300 flex items-center gap-1"><Mail className="w-3 h-3" />{row.email}</p>}
          {row.phone && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{row.phone}</p>}
          {!row.email && !row.phone && <span className="text-xs text-slate-500">—</span>}
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Location',
      sortable: true,
      render: (row) => row.city ? (
        <span className="text-xs text-slate-300">{[row.city, row.country].filter(Boolean).join(', ')}</span>
      ) : <span className="text-xs text-slate-500">—</span>,
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
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Customers</h2>
            <p className="text-sm text-slate-400">{total} customer{total === 1 ? '' : 's'}</p>
          </div>
        </div>
        <button onClick={loadCustomers} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Error loading customers</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <DataTable<Customer>
        data={customers}
        columns={columns}
        searchable={true}
        searchKeys={['name', 'email', 'phone', 'company']}
        pageSize={15}
        emptyMessage="No customers yet. Add customers via WaveCoreERP CRM first."
        loading={loading}
      />
    </div>
  )
}