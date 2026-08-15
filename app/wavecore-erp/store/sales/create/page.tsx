'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateSalePage() {
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }])
  const [customerName, setCustomerName] = useState('')

  const addItem = () => setItems([...items, { name: '', quantity: 1, price: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: any) => {
    const n = [...items]
    ;(n[i] as any)[field] = value
    setItems(n)
  }

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">New Sale</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Add Sale</h1>
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <label className="block text-sm font-medium mb-2">Customer Name</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border" placeholder="Walk-in customer" />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_120px_40px] gap-3 mb-3">
                <input type="text" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Item name" />
                <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Qty" />
                <input type="number" value={item.price || ''} onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg border text-sm" placeholder="Price" />
                <button onClick={() => removeItem(i)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="border-t pt-4 mt-4 text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-3xl font-bold text-green-600">KSh {total.toFixed(2)}</p>
            </div>
          </div>
          <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 py-3 text-lg">
            <ShoppingCart className="w-5 h-5" /> Complete Sale
          </Button>
        </div>
      </main>
    </div>
  )
}