'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Layers, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TemplatesPage() {
  const [templates] = useState([
    { name: 'Invoice Approval', desc: 'Route invoices for manager approval', trigger: 'On Create', steps: 3, category: 'Finance' },
    { name: 'Leave Request', desc: 'Employee leave approval workflow', trigger: 'On Submit', steps: 2, category: 'HR' },
    { name: 'Purchase Order', desc: 'PO approval and processing', trigger: 'On Create', steps: 4, category: 'Finance' },
    { name: 'New Lead Assignment', desc: 'Auto-assign leads to sales reps', trigger: 'On Create', steps: 2, category: 'CRM' },
    { name: 'Low Stock Alert', desc: 'Notify when stock drops below minimum', trigger: 'On Update', steps: 2, category: 'Inventory' },
    { name: 'Welcome Email', desc: 'Send welcome email to new customers', trigger: 'On Create', steps: 1, category: 'CRM' },
  ])
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Workflow Templates</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Layers className="w-6 h-6 text-green-500" /> Workflow Templates</h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search templates..." />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg">
              <p className="font-bold">{t.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
              <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">{t.category}</span>
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">{t.steps} steps</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}