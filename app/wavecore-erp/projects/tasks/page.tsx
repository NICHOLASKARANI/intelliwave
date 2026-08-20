'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GitBranch, Download, Plus, Trash2, CheckCircle, Clock } from 'lucide-react'

interface Task {
  id: string
  title: string
  dependency: string
  status: 'PENDING' | 'COMPLETED'
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [dependency, setDependency] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('project-tasks')
    if (saved) setTasks(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('project-tasks', JSON.stringify(tasks))
  }, [tasks])

  const addTask = () => {
    if (!title) return
    setTasks(prev => [...prev, { id: Date.now().toString(), title, dependency: dependency || 'None', status: 'PENDING' }])
    setTitle('')
    setDependency('')
  }

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'PENDING' ? 'COMPLETED' : 'PENDING' } : t))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Tasks & Dependencies', '='.repeat(50), `Tasks: ${tasks.length}`, '', ...tasks.map((t, i) => `${i+1}. ${t.title} (Depends on: ${t.dependency}) - ${t.status}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'tasks.pdf'; a.click()
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
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="w-6 h-6 text-cyan-500" /> Tasks & Dependencies</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>

        <div className="flex gap-2 mb-6">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Task title" />
          <input type="text" value={dependency} onChange={(e) => setDependency(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Depends on..." />
          <button onClick={addTask} className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white"><Plus className="w-4 h-4" /></button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {tasks.map(t => (
            <div key={t.id} className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleStatus(t.id)} className={t.status === 'COMPLETED' ? 'text-green-500' : 'text-neutral-400'}>
                  {t.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </button>
                <div>
                  <p className={`font-medium ${t.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                  <p className="text-xs text-muted-foreground">Depends on: {t.dependency}</p>
                </div>
              </div>
              <button onClick={() => deleteTask(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center py-8 text-muted-foreground">No tasks</p>}
        </div>
      </main>
    </div>
  )
}