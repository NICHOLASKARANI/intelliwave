'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gauge, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RoutingPage() {
  const [routes, setRoutes] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')

  const handleAdd = () => {
    if (!name) return
    setRoutes([{ id: Date.now().toString(), name, operations: [] }, ...routes])
    setShowAdd(false); setName('')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Routing</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gauge className="w-6 h-6 text-teal-500" /> Routing</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> New Route</Button>
        </div>
        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Route Name" />
            <Button onClick={handleAdd} className="mt-3">Create Route</Button>
          </div>
        )}
        {routes.length > 0 ? (
          <div className="space-y-3">{routes.map(r => (
            <div key={r.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900"><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">Operations: {r.operations.length}</p></div>
          ))}</div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Gauge className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No routes yet</p></div>
        )}
      </main>
    </div>
  )
}