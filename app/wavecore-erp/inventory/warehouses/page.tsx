'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Warehouse, Search, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  async function fetchWarehouses() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/inventory/warehouses')
      if (res.ok) { const data = await res.json(); setWarehouses(data.warehouses || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchWarehouses() }, [])

  const handleAdd = async () => {
    if (!name || !code) return
    try {
      await fetch('/api/wavecore/inventory/warehouses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      })
      setShowAdd(false); setName(''); setCode(''); fetchWarehouses()
    } catch {}
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Warehouses</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> Add Warehouse</Button>
        </div>
        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6 flex gap-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Warehouse name" />
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-32 px-4 py-2.5 rounded-xl border" placeholder="Code" />
            <Button onClick={handleAdd}>Add</Button>
          </div>
        )}
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div> :
          warehouses.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {warehouses.map(w => (
                <div key={w.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                  <Warehouse className="w-6 h-6 text-teal-500 mb-3" />
                  <p className="font-bold">{w.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {w.code}</p>
                  <p className="text-sm text-muted-foreground">Stock: {w.total_stock || 0} items</p>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No warehouses yet</p></div>
        }
      </main>
    </div>
  )
}