'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Factory, Plus, Loader2, Search, Printer, Trash2, X } from 'lucide-react'

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [form, setForm] = useState({ productId: '', quantity: '', type: 'MANUFACTURING', priority: 'MEDIUM', notes: '' })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/manufacturing/work-orders'),
        fetch('/api/wavecore/inventory/products')
      ])
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()
      setOrders(ordersData.workOrders || [])
      setProducts(productsData.products || [])
    } catch (error) {
      setError('Failed to fetch work orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.productId || !form.quantity || Number(form.quantity) <= 0) {
      setError('Product and quantity required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) })
      })
      if (res.ok) {
        setSuccess('Work order created!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ productId: '', quantity: '', type: 'MANUFACTURING', priority: 'MEDIUM', notes: '' })
        setShowForm(false)
        fetchOrders()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteOrder = async (id: string, number: string) => {
    if (!confirm('Delete work order ' + number + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchOrders()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/manufacturing/work-orders/' + id + '/pdf', '_blank')
  }

  const filtered = orders.filter(o =>
    (o.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.status || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Work Orders</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Factory className="w-6 h-6 text-purple-500" /> Work Orders ({orders.length})
          </h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Create Work Order
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800">{success}</div>}

        {showForm && (
          <form onSubmit={createOrder} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg text-white">New Work Order</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="PACKAGING">Packaging</option>
              </select>
              <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white col-span-2" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold">Create Work Order</button>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white w-full" placeholder="Search work orders..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No work orders</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm text-neutral-400">Number</th>
                  <th className="text-left p-4 text-sm text-neutral-400">Type</th>
                  <th className="text-right p-4 text-sm text-neutral-400">Qty</th>
                  <th className="text-left p-4 text-sm text-neutral-400">Status</th>
                  <th className="text-left p-4 text-sm text-neutral-400">Priority</th>
                  <th className="text-center p-4 text-sm text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4 font-mono text-white">{order.number}</td>
                    <td className="p-4 text-neutral-300">{order.type || 'MANUFACTURING'}</td>
                    <td className="p-4 text-right font-bold text-white">{order.quantity}</td>
                    <td className="p-4">
                      <span className={'px-2 py-1 rounded-full text-xs font-bold ' + (
                        order.status === 'COMPLETED' ? 'bg-green-900/50 text-green-300' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      )}>{order.status}</span>
                    </td>
                    <td className="p-4">
                      <span className={'px-2 py-1 rounded-full text-xs font-bold ' + (
                        order.priority === 'HIGH' ? 'bg-red-900/50 text-red-300' :
                        order.priority === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-blue-900/50 text-blue-300'
                      )}>{order.priority || 'MEDIUM'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(order.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteOrder(order.id, order.number)} disabled={deleting === order.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-50" title="Delete">
                          {deleting === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
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