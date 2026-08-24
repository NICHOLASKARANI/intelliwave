'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Workflow, Plus, Search, Play, Pause, Trash2, Edit3, Loader2 } from 'lucide-react'

interface WorkflowItem {
  id: string
  name: string
  trigger: string
  status: string
  createdAt: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<WorkflowItem | null>(null)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/automation')
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow permanently?')) return
    try {
      await fetch(`/api/wavecore/automation?id=${id}`, { method: 'DELETE' })
      fetchWorkflows()
    } catch {}
  }

  const handleToggle = async (workflow: WorkflowItem) => {
    const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      await fetch('/api/wavecore/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, status: newStatus }),
      })
      fetchWorkflows()
    } catch {}
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await fetch('/api/wavecore/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      setEditing(null)
      fetchWorkflows()
    } catch {}
  }

  const filtered = workflows.filter(w =>
    (w.name || '').toLowerCase().includes(search.toLowerCase())
  )

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Workflow className="w-6 h-6 text-orange-500" /> All Workflows ({filtered.length})</h1>
          <Link href="/wavecore-erp/automation/workflows/create">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-medium"><Plus className="w-4 h-4" /> New Workflow</button>
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search workflows..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Workflow className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No workflows</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {filtered.map(workflow => (
              <div key={workflow.id} className="flex justify-between items-center p-4 border-b hover:bg-neutral-50">
                <div>
                  <p className="font-medium">{workflow.name}</p>
                  <p className="text-xs text-muted-foreground">{workflow.trigger} • {workflow.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggle(workflow)} className={`p-2 rounded-lg ${workflow.status === 'ACTIVE' ? 'text-green-500' : 'text-amber-500'}`}>
                    {workflow.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(workflow)} className="p-2 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(workflow.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Workflow</h2>
            <input type="text" value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-3" />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-medium">Save</button>
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}