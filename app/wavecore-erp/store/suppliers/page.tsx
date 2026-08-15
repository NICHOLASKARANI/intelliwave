'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit3, Users, ArrowLeft, Phone, Mail, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  company: string
  credit: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!name) { setError('Name required'); setLoading(false); return }

    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      credit: 0,
    }
    setSuppliers([...suppliers, newSupplier])
    setShowAdd(false)
    setName(''); setEmail(''); setPhone(''); setCompany('')
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id))
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.company?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Suppliers</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Supplier
          </Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Add Supplier</h3>
            {error && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
            <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
              </div>
              <div><label className="block text-sm font-medium mb-2">Company</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div className="col-span-2">
                <Button type="submit" disabled={loading} className="gap-2"><Save className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Supplier'}</Button>
              </div>
            </form>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search suppliers by name, company, or phone..." />
        </div>

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                      {s.name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.company || 'Supplier'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>}
                  {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between">
                  <span className="text-xs text-muted-foreground">Credit Balance</span>
                  <span className={`font-bold ${s.credit > 0 ? 'text-red-600' : 'text-green-600'}`}>KSh {s.credit.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No suppliers found</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first supplier</p>
            <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add Supplier</Button>
          </div>
        )}
      </main>
    </div>
  )
}