'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateQuotationPage() {
  const [customerName, setCustomerName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!customerName || !amount) { setError('Customer name and amount required'); setLoading(false); return }
    try {
      // Create customer first
      const custRes = await fetch('/api/wavecore/crm/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName }),
      })
      const custData = await custRes.json()
      if (!custRes.ok && !custData.customer) { setError('Failed to create customer'); return }
      router.push('/wavecore-erp/crm/quotations')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Create Quotation</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Quotation</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div><label className="block text-sm font-medium mb-2">Customer Name *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
          </div>
          <div><label className="block text-sm font-medium mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" rows={3} />
          </div>
          <div><label className="block text-sm font-medium mb-2">Amount (KSh) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required min="0" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Quotation'}
          </Button>
        </form>
      </main>
    </div>
  )
}