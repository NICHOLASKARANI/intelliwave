'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Users, Search, Trash2, Loader2, Printer, Mail, Phone } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: string
  status: string
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/customers')
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (err) {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/customers?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchCustomers()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/customers/${id}/pdf`, '_blank')
  }

  const filtered = customers.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Customers</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" /> Customers ({customers.length})
          </h1>
          <Link href="/wavecore-erp/crm/customers/create"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Customer
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search customers..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No customers yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(customer => (
              <div key={customer.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{customer.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(customer.id)} title="Download PDF"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCustomer(customer.id)} title="Delete"
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    {deleting === customer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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