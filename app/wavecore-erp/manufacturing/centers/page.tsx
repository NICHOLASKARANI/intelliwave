'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Cog, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WorkCentersPage() {
  const [centers, setCenters] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [efficiency, setEfficiency] = useState('100')

  const handleAdd = () => {
    if (!name) return
    setCenters([{ id: Date.now().toString(), name, capacity: parseFloat(capacity) || 0, efficiency: parseFloat(efficiency) || 100 }, ...centers])
    setShowAdd(false); setName(''); setCapacity(''); setEfficiency('100')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Work Centers</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Cog className="w-6 h-6 text-purple-500" /> Work Centers</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-purple-600"><Plus className="w-4 h-4" /> Add Center</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Center Name" />
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Capacity" />
              <input type="number" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Efficiency %" />
            </div>
            <Button onClick={handleAdd} className="mt-3">Add Center</Button>
          </div>
        )}

        {centers.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {centers.map(c => (
              <div key={c.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div><Cog className="w-6 h-6 text-purple-500 mb-2" /><p className="font-bold">{c.name}</p><p className="text-sm text-muted-foreground">Capacity: {c.capacity} | Efficiency: {c.efficiency}%</p></div>
                <button className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Cog className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No work centers yet</p></div>
        )}
      </main>
    </div>
  )
}