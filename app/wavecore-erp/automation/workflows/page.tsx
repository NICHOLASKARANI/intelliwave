'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Workflow, Plus, Search, Play, Pause, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([
    { id: '1', name: 'Invoice Approval', trigger: 'On Invoice Created', status: 'ACTIVE', runs: 0 },
    { id: '2', name: 'Low Stock Alert', trigger: 'On Stock Update', status: 'ACTIVE', runs: 0 },
    { id: '3', name: 'Welcome Email', trigger: 'On Customer Created', status: 'PAUSED', runs: 0 },
  ])
  const [search, setSearch] = useState('')

  const filtered = workflows.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()))

  const toggleStatus = (id: string) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, status: w.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : w))
  }

  const handleDelete = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id))
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/automation" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">All Workflows</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Workflow className="w-6 h-6 text-orange-500" /> All Workflows</h1>
          <Link href="/wavecore-erp/automation/workflows/create"><Button className="gap-2 bg-orange-600"><Plus className="w-4 h-4" /> New Workflow</Button></Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search workflows..." />
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(w => (
              <div key={w.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Workflow className="w-5 h-5 text-orange-500" />
                  <div><p className="font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.trigger}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(w.id)} className={`p-2 rounded-lg ${w.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}`}>
                    {w.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-12 text-muted-foreground">No workflows found</p>}
      </main>
    </div>
  )
}