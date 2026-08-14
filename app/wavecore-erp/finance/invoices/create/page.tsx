'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeft, Save, Plus, Trash2, FileText } from 'lucide-react'
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

export default function CreateInvoicePage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
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

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!customerId) {
      setError('Please select a customer')
      setLoading(false)
      return
    }

    if (items.some(i => !i.description)) {
      setError('All line items need a description')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          date,
          dueDate: dueDate || date,
          items: items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create invoice')
        return
      }

      router.push('/wavecore-erp/finance/invoices')
      router.refresh()
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
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
            <span className="text-sm">New Invoice</span>
          </div>
          <Link href="/wavecore-erp/finance/invoices" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background">
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Invoice Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border bg-background"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  min="1"
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border bg-background"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  min="0"
                  step="0.01"
                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                  className="w-28 px-3 py-2 rounded-xl border bg-background"
                />
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>VAT (16%)</span><span>{tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/finance/invoices"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}