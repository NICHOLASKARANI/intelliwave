'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  email: string | null
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])
  const [taxRate, setTaxRate] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wavve-si/restaurant/customers?limit=200', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load customers'))
      .then(d => {
        setCustomers(d.customers || [])
        if (d.customers?.length > 0) setCustomerId(d.customers[0].id)
      })
      .catch(() => {})
  }, [])

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  const taxAmount = subtotal * (Number(taxRate) / 100)
  const total = subtotal + taxAmount

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(i: number) {
    if (items.length === 1) return
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof LineItem, value: any) {
    const copy = [...items]
    copy[i] = { ...copy[i], [field]: value }
    setItems(copy)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!customerId) { setError('Please select a customer'); return }
    if (items.some(i => !i.description.trim())) { setError('All items need a description'); return }
    if (items.some(i => Number(i.quantity) <= 0)) { setError('All quantities must be greater than 0'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/wavve-si/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          items: items.map(i => ({
            description: i.description.trim(),
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
          taxRate: Number(taxRate) || 0,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create order')
      }
      const data = await res.json()
      setSuccess(`Order ${data.order.number} created successfully!`)
      setTimeout(() => router.push('/wavve-si/modules/restaurant-hospitality/orders'), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <Link href="/wavve-si/modules/restaurant-hospitality/orders" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Create New Order</h2>
          <p className="text-sm text-slate-400">Build the order, then submit</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 text-green-300 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <label className="block text-sm font-bold text-white mb-2">Customer</label>
          {customers.length === 0 ? (
            <p className="text-sm text-amber-400">No customers yet. Add a customer via WaveCoreERP CRM first.</p>
          ) : (
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} required className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="">— Select a customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ''}</option>
              ))}
            </select>
          )}
        </div>

        {/* Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-white">Order Items</label>
            <button type="button" onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Description (e.g. Chicken Burger)"
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  className="col-span-5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                  className="col-span-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="col-span-1 text-sm text-slate-400 text-right">
                  {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}
                </div>
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="col-span-1 p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-30 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Tax Rate (%)</span>
            <input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white text-right focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-sm text-slate-400">Subtotal</span>
            <span className="text-sm font-bold text-white">KSh {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Tax</span>
            <span className="text-sm font-bold text-white">KSh {taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-base font-bold text-white">Total</span>
            <span className="text-lg font-bold text-green-400">KSh {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || customers.length === 0} className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            {loading ? 'Creating…' : 'Create Order'}
          </button>
          <Link href="/wavve-si/modules/restaurant-hospitality/orders" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}