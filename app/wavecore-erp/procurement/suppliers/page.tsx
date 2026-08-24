'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Download, Loader2, Trash2, Search, Phone, Mail, Building2 } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  category: string
  createdAt: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', category: 'General' })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/wavecore/suppliers')
      const data = await res.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error('Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  const addSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/wavecore/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', email: '', phone: '', category: 'General' })
        setShowForm(false)
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Failed to add supplier')
    }
  }

  const deleteSupplier = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    try {
      await fetch(`/api/wavecore/suppliers?id=${id}`, { method: 'DELETE' })
      fetchSuppliers()
    } catch (error) {
      console.error('Failed to delete supplier')
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Suppliers List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 3px solid #059669; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9fafb; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .date { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Suppliers List</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Category</th></tr>
            </thead>
            <tbody>
              ${suppliers.map(s => `<tr><td>${s.name}</td><td>${s.email || '-'}</td><td>${s.phone || '-'}</td><td>${s.category}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Suppliers</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" /> Suppliers ({suppliers.length})
          </h1>
          <div className="flex gap-2">
            <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={addSupplier} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Supplier Name" required value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="email" placeholder="Email" value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="text" placeholder="Phone" value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <select value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="px-4 py-2 rounded-xl border">
                <option>General</option><option>Raw Materials</option><option>Services</option><option>Equipment</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white">Save Supplier</button>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search suppliers..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No suppliers yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Name</th>
                  <th className="text-left p-4 text-sm">Email</th>
                  <th className="text-left p-4 text-sm">Phone</th>
                  <th className="text-left p-4 text-sm">Category</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(supplier => (
                  <tr key={supplier.id} className="border-t">
                    <td className="p-4 font-medium">{supplier.name}</td>
                    <td className="p-4 flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{supplier.email || '-'}</td>
                    <td className="p-4 flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{supplier.phone || '-'}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">{supplier.category}</span></td>
                    <td className="p-4"><button onClick={() => deleteSupplier(supplier.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
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