'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Flag, Plus, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleAdd = () => {
    if (!title) return
    setMilestones([{ id: Date.now().toString(), title, dueDate, completed: false }, ...milestones])
    setShowAdd(false); setTitle(''); setDueDate('')
  }

  const toggleComplete = (id: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m))
  }

  const completed = milestones.filter(m => m.completed).length
  const progress = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Milestones</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Flag className="w-6 h-6 text-emerald-500" /> Milestones</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-emerald-600"><Plus className="w-4 h-4" /> Add Milestone</Button>
        </div>

        <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{completed}/{milestones.length} completed</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Milestone title *" />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-4 py-2.5 rounded-xl border" />
            </div>
            <Button onClick={handleAdd} className="mt-3">Add</Button>
          </div>
        )}

        {milestones.length > 0 ? (
          <div className="space-y-3">
            {milestones.map(m => (
              <div key={m.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex items-center gap-3">
                <button onClick={() => toggleComplete(m.id)}>
                  {m.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${m.completed ? 'line-through' : ''}`}>{m.title}</p>
                  {m.dueDate && <p className="text-xs text-muted-foreground"><Calendar className="w-3 h-3 inline mr-1" /> {new Date(m.dueDate).toLocaleDateString()}</p>}
                </div>
                <button className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No milestones yet</p>
          </div>
        )}
      </main>
    </div>
  )
}