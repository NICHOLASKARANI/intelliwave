'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Trash2, Loader2, GripVertical, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COLUMNS = [
  { id: 'PENDING', title: 'Pending', color: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-500' },
  { id: 'ON_HOLD', title: 'On Hold', color: 'bg-amber-500' },
]

export default function KanbanPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/projects')
      if (res.ok) { const data = await res.json(); setProjects(data.projects || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!title) { setError('Card title required'); return }
    try {
      const res = await fetch('/api/wavecore/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: 'PENDING', priority, budget: 0 }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Card added!'); setShowAdd(false); setTitle(''); fetchProjects() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/wavecore/projects/${id}`, { method: 'DELETE' }); fetchProjects() } catch {}
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Kanban Board</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> Add Card</Button>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Card title *" />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
            <Button onClick={handleAdd} className="mt-3">Add Card</Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            {COLUMNS.map(col => (
              <div key={col.id} className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-3 min-h-[400px]">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="font-bold text-sm">{col.title}</span>
                  <span className="text-xs bg-white dark:bg-neutral-700 px-2 py-0.5 rounded-full ml-auto">
                    {projects.filter(p => p.status === col.id).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {projects.filter(p => p.status === col.id).map(p => (
                    <div key={p.id} className="bg-white dark:bg-neutral-900 rounded-xl border p-3 hover:shadow-md transition-all">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <p className="font-medium text-sm flex-1">{p.title}</p>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}