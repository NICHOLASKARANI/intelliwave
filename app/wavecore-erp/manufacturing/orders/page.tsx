'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClipboardList, Plus, Trash2, Loader2, Factory, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [priority, setPriority] = useState('MEDIUM')
  const [search, setSearch] = useState('')

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders')
      if (res.ok) { const data = await res.json(); setOrders(data.workOrders || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleAdd = async () => {
    if (!productName) return
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, quantity: parseInt(quantity) || 1, priority }),
      })
      if (res.ok) { setShowAdd(false); setProductName(''); setQuantity('1'); fetchOrders() }
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this work order?')) return
    try { await fetch(`/api/wavecore/manufacturing/work-orders/${id}`, { method: 'DELETE' }); fetchOrders() } catch {}
  }

  const filtered = orders.filter(o => o.productName?.toLowerCase().includes(search.toLowerCase()) || o.number?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Work Orders</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-blue-500" /> Work Orders</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> New Work Order</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <h3 className="font-bold mb-3">Create Work Order</h3>
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Product to produce *" />
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Quantity" min="1" />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
            <Button onClick={handleAdd} className="mt-3">Create Work Order</Button>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search work orders..." />
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div> :
          filtered.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Order #</th><th className="text-left p-4">Product</th>
                  <th className="text-center p-4">Quantity</th><th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th>
                </tr></thead>
                <tbody>{filtered.map(o => (
                  <tr key={o.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-mono">{o.number}</td><td className="p-4 font-medium">{o.productName}</td>
                    <td className="p-4 text-center">{o.quantity}</td><td className="p-4">{o.priority}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs bg-gray-50 rounded-full">{o.status}</span></td>
                    <td className="p-4 text-center"><button onClick={() => handleDelete(o.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Factory className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No work orders yet</p></div>
        }
      </main>
    </div>
  )
}