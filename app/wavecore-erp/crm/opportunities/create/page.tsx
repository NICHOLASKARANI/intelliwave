'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateOpportunityPage() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [stage, setStage] = useState('QUALIFICATION')
  const [probability, setProbability] = useState('20')
  const [customers, setCustomers] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('/api/wavecore/crm/customers')
        if (res.ok) {
          const data = await res.json()
          setCustomers(data.customers || [])
        }
      } catch {}
    }
    fetchCustomers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let finalCustomerId = customerId
    if (!finalCustomerId && customerName) {
      const custRes = await fetch('/api/wavecore/crm/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName }),
      })
      const custData = await custRes.json()
      if (custRes.ok && custData.customer) finalCustomerId = custData.customer.id
    }

    if (!name || !amount || !finalCustomerId) {
      setError('Name, amount, and customer required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount: parseFloat(amount), stage, probability: parseInt(probability), customerId: finalCustomerId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create opportunity'); return }
      router.push('/wavecore-erp/crm/opportunities')
      router.refresh()
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
          <Link href="/wavecore-erp/crm/opportunities" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">New Opportunity</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div><label className="block text-sm font-medium mb-2">Opportunity Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
          </div>
          <div><label className="block text-sm font-medium mb-2">Amount (KSh) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required min="0" />
          </div>
          <div><label className="block text-sm font-medium mb-2">Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
              <option value="QUALIFICATION">Qualification</option>
              <option value="NEEDS_ANALYSIS">Needs Analysis</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Probability (%)</label>
            <input type="number" value={probability} onChange={(e) => setProbability(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" max="100" />
          </div>
          <div><label className="block text-sm font-medium mb-2">Select Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Or New Customer Name</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Opportunity'}
          </Button>
        </form>
      </main>
    </div>
  )
}