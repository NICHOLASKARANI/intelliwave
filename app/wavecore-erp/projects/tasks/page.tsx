'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ListTodo, Plus, Trash2, CheckCircle, Circle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dependsOn, setDependsOn] = useState('')

  const handleAdd = () => {
    if (!name) return
    setTasks([{ id: Date.now().toString(), name, priority, dependsOn: dependsOn || null, completed: false }, ...tasks])
    setShowAdd(false); setName(''); setDependsOn('')
  }

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Tasks</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ListTodo className="w-6 h-6 text-purple-500" /> Tasks & Dependencies</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-purple-600"><Plus className="w-4 h-4" /> Add Task</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Task name *" />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">Depends On (Task ID)</label>
              <input type="text" value={dependsOn} onChange={(e) => setDependsOn(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="e.g., Task #1" />
            </div>
            <Button onClick={handleAdd} className="mt-3">Add Task</Button>
          </div>
        )}

        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex items-center gap-3">
                <button onClick={() => toggleComplete(t.id)}>
                  {t.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${t.completed ? 'line-through text-muted-foreground' : ''}`}>{t.name}</p>
                  {t.dependsOn && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Depends on: {t.dependsOn}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${t.priority === 'HIGH' ? 'bg-red-50 text-red-600' : t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'}`}>{t.priority}</span>
                <button className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tasks yet</p>
          </div>
        )}
      </main>
    </div>
  )
}