'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddCustomerPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!name) { setError('Name is required'); setLoading(false); return }
    try {
      const res = await fetch('/api/wavecore/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || null, phone: phone || null, company: company || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add customer'); return }
      router.push('/wavecore-erp/crm/customers')
      router.refresh()
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Add Customer</span>
          </div>
          <Link href="/wavecore-erp/crm/customers" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Add Customer</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div><label className="block text-sm font-medium mb-2">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
          </div>
          <div><label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <div><label className="block text-sm font-medium mb-2">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <div><label className="block text-sm font-medium mb-2">Company</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Customer'}
          </Button>
        </form>
      </main>
    </div>
  )
}