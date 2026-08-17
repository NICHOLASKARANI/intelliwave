'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClipboardList, Plus, Search, Download, Trash2, Timer, Factory } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [priority, setPriority] = useState('MEDIUM')

  const handleAdd = () => {
    if (!productName) return
    setOrders([{
      id: Date.now().toString(), number: 'WO-' + Date.now().toString().slice(-6),
      productName, quantity: parseInt(quantity) || 1, priority, status: 'DRAFT',
      createdAt: new Date().toISOString(),
    }, ...orders])
    setShowAdd(false); setProductName(''); setQuantity('1')
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-50 text-gray-600', CONFIRMED: 'bg-blue-50 text-blue-600',
    IN_PROGRESS: 'bg-purple-50 text-purple-600', COMPLETED: 'bg-green-50 text-green-600', CANCELLED: 'bg-red-50 text-red-600',
  }

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
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-blue-500" /> Work Orders</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-blue-600"><Plus className="w-4 h-4" /> New Work Order</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Product to produce" />
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Quantity" min="1" />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
            <Button onClick={handleAdd} className="mt-3">Create Work Order</Button>
          </div>
        )}

        {orders.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left p-4">Order #</th><th className="text-left p-4">Product</th>
                <th className="text-center p-4">Quantity</th><th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>{orders.map(o => (
                <tr key={o.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <td className="p-4 font-mono">{o.number}</td><td className="p-4 font-medium">{o.productName}</td>
                  <td className="p-4 text-center">{o.quantity}</td>
                  <td className="p-4">{o.priority}</td>
                  <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${statusColors[o.status]}`}>{o.status}</span></td>
                  <td className="p-4 text-center"><button className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No work orders yet</p>
          </div>
        )}
      </main>
    </div>
  )
}