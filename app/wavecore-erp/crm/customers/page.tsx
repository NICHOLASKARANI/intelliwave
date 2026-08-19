'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Users, Search, Trash2, Edit3, ArrowLeft, Loader2 } from 'lucide-react'
import { downloadPDF, generatePDFContent } from '@/lib/wavecore/pdf-export'
import { Button } from '@/components/ui/button'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: string
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchCustomers() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    try {
      const res = await fetch(`/api/wavecore/crm/customers/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCustomers()
    } catch {}
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Customers</span>
          </div>
          <Link href="/wavecore-erp/crm" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> CRM
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Customers</h1>
          <button onClick={() => downloadPDF('customers.pdf', generatePDFContent('WaveCore ERP - Customers', customers))} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Download className="w-4 h-4" /> Download PDF</button>
          <button onClick={() => downloadPDF('customers.pdf', generatePDFContent('WaveCore ERP - Customers', customers))} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Download className="w-4 h-4" /> Download PDF</button>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border text-sm" placeholder="Search..." />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Company</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4">{c.email || '-'}</td>
                    <td className="p-4">{c.phone || '-'}</td>
                    <td className="p-4">{c.company || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No customers yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first customer</p>
          </div>
        )}
      </main>
    </div>
  )
}