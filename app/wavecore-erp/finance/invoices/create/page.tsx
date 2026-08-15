'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function CreateInvoicePage() {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!customerName) { setError('Customer name is required'); setLoading(false); return }
    if (items.some(i => !i.description)) { setError('All line items need a description'); setLoading(false); return }
    if (subtotal <= 0) { setError('Invoice total must be greater than zero'); setLoading(false); return }

    try {
      // Step 1: Create customer (or get existing)
      const customerRes = await fetch('/api/wavecore/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName,
          email: customerEmail || null,
          phone: customerPhone || null,
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
        }),
      })

      const customerData = await customerRes.json()

      let customerId = customerData?.customer?.id

      // If customer already exists, search for them
      if (!customerRes.ok) {
        const searchRes = await fetch(`/api/wavecore/crm/customers?search=${encodeURIComponent(customerName)}`)
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          if (searchData.customers?.length > 0) {
            customerId = searchData.customers[0].id
          } else {
            setError('Failed to create customer')
            setLoading(false)
            return
          }
        }
      }

      // Step 2: Create invoice
      const invoiceRes = await fetch('/api/wavecore/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          date,
          dueDate: dueDate || date,
          items: items.map(i => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
        }),
      })

      const invoiceData = await invoiceRes.json()

      if (!invoiceRes.ok) {
        setError(invoiceData.error || 'Failed to create invoice')
        return
      }

      router.push('/wavecore-erp/finance/invoices')
      router.refresh()
    } catch (err) {
      setError('Network error. Please try again.')
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
          {/* Customer Details */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h3 className="font-bold mb-4">Customer Details</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="+254..." />
              </div>
            </div>
          </div>

          {/* Invoice Dates */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border bg-background" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border bg-background" />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_80px_120px_40px] gap-3 mb-3">
                <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Item description" required />
                <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Qty" min="1" />
                <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Price" min="0" step="0.01" />
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>VAT (16%)</span><span>{tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>KSh {total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/finance/invoices"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}