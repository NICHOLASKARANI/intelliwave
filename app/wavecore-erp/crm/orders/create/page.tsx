'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateOrderPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [quotationId, setQuotationId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  useEffect(() => {
    fetch('/api/wavecore/crm/customers')
      .then(r => r.json())
      .then(d => setCustomers(d.customers || []))
      .catch(() => {})
    fetch('/api/wavecore/crm/quotations')
      .then(r => r.json())
      .then(d => setQuotations((d.quotations || []).filter((q: any) => ['DRAFT','SENT','ACCEPTED'].includes(q.status))))
      .catch(() => {})
  }, [])

  // When a quotation is selected, prefill customer + line items from it
  useEffect(() => {
    if (!quotationId) return
    fetch('/api/wavecore/crm/quotations/' + quotationId, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.quotation?.customerId) setCustomerId(d.quotation.customerId)
        if (d.quotation?.notes && !notes) setNotes(d.quotation.notes)
        if (Array.isArray(d.items) && d.items.length > 0) {
          setItems(d.items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
          })))
        }
      })
      .catch(() => {})
    // eslint-disable-next-line
  }, [quotationId])

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!customerId) { setError('Select a customer'); setLoading(false); return }
    if (items.some(i => !i.description.trim())) { setError('All line items need a description'); setLoading(false); return }

    try {
      const res = await fetch('/api/wavecore/crm/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          customerId,
          quotationId: quotationId || null,
          deliveryDate: deliveryDate || null,
          notes: notes || null,
          items: items.map(i => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      router.push('/wavecore-erp/crm/orders')
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
          <Link href="/wavecore-erp/crm/orders" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Sales Order</h1>
        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Convert from Quotation (optional)</label>
              <select value={quotationId} onChange={(e) => setQuotationId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border">
                <option value="">— none —</option>
                {quotations.map(q => <option key={q.id} value={q.id}>{q.number} · {q.customer_name || 'no customer'} · {Number(q.total || 0).toLocaleString()}</option>)}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Pick a quotation to auto-fill customer and line items.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Delivery date (optional)</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Internal notes about this order..." />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_120px_40px] gap-3 mb-3">
                <input type="text" value={item.description} onChange={(e) => { const n = [...items]; n[i].description = e.target.value; setItems(n) }}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Description" />
                <input type="number" value={item.quantity || ''} onChange={(e) => { const n = [...items]; n[i].quantity = parseFloat(e.target.value) || 0; setItems(n) }}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Qty" />
                <input type="number" value={item.unitPrice || ''} onChange={(e) => { const n = [...items]; n[i].unitPrice = parseFloat(e.target.value) || 0; setItems(n) }}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Price" />
                <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="border-t pt-4 mt-4 space-y-1 text-sm">
              <p className="text-right text-neutral-500">Subtotal: KSh {subtotal.toFixed(2)}</p>
              <p className="text-right text-neutral-500">Tax (16%): KSh {tax.toFixed(2)}</p>
              <p className="text-right font-bold text-lg">Total: KSh {total.toFixed(2)}</p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Sales Order'}
          </Button>
        </form>
      </main>
    </div>
  )
}