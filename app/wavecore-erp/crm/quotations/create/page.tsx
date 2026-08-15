'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Customer {
  id: string
  name: string
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function CreateQuotationPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])
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

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let finalCustomerId = customerId

    // If no customer selected but name provided, create customer
    if (!finalCustomerId && customerName) {
      const custRes = await fetch('/api/wavecore/crm/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName }),
      })
      const custData = await custRes.json()
      if (custRes.ok && custData.customer) {
        finalCustomerId = custData.customer.id
      }
    }

    if (!finalCustomerId) {
      setError('Select or enter a customer')
      setLoading(false)
      return
    }

    if (items.some(i => !i.description)) {
      setError('All line items need a description')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/crm/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          items: items.map(i => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create quotation'); return }
      router.push('/wavecore-erp/crm/quotations')
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
          <Link href="/wavecore-erp/crm/quotations" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Quotation</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h3 className="font-bold mb-4">Customer</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Existing Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Or Enter New Customer Name</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border" placeholder="New customer name" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_80px_120px_40px] gap-3 mb-3">
                <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Description" required />
                <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Qty" min="1" />
                <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Price" min="0" step="0.01" />
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <p className="text-right font-bold text-lg">Total: KSh {subtotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/crm/quotations"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}