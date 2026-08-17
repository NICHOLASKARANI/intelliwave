'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Plus, Search, Download, Trash2, Edit3, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BOMPage() {
  const [boms, setBoms] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')

  const handleAdd = () => {
    if (!name || !productName) return
    setBoms([{ id: Date.now().toString(), name, productName, quantity: parseFloat(quantity) || 1, components: [] }, ...boms])
    setShowAdd(false); setName(''); setProductName(''); setQuantity('1')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Bill of Materials</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-green-500" /> Bill of Materials</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-green-600"><Plus className="w-4 h-4" /> New BOM</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="BOM Name" />
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Product Name" />
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Quantity" min="1" />
            </div>
            <Button onClick={handleAdd} className="mt-3">Create BOM</Button>
          </div>
        )}

        {boms.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {boms.map(b => (
              <div key={b.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{b.productName} • Qty: {b.quantity}</p>
                  </div>
                  <button className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="text-sm text-muted-foreground">Components: {b.components?.length || 0}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No BOMs yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first Bill of Materials</p>
          </div>
        )}
      </main>
    </div>
  )
}