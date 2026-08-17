'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Trash2, Briefcase, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [availability, setAvailability] = useState('100')

  const handleAdd = () => {
    if (!name) return
    setResources([{ id: Date.now().toString(), name, role, availability: parseInt(availability) || 100 }, ...resources])
    setShowAdd(false); setName(''); setRole(''); setAvailability('100')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Resource Planning</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-500" /> Resource Planning</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-blue-600"><Plus className="w-4 h-4" /> Add Resource</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Name *" />
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Role" />
              <input type="number" value={availability} onChange={(e) => setAvailability(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Availability %" />
            </div>
            <Button onClick={handleAdd} className="mt-3">Add</Button>
          </div>
        )}

        {resources.length > 0 ? (
          <div className="space-y-3">
            {resources.map(r => (
              <div key={r.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{r.name?.[0]}</div>
                  <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.role}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.availability}%` }} />
                  </div>
                  <span className="text-sm font-medium">{r.availability}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No resources yet</p>
          </div>
        )}
      </main>
    </div>
  )
}