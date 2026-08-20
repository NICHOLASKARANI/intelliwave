'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Target, Download, Plus, Trash2, CheckCircle, Circle } from 'lucide-react'

interface Milestone {
  id: string
  name: string
  date: string
  achieved: boolean
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('project-milestones')
    if (saved) setMilestones(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('project-milestones', JSON.stringify(milestones))
  }, [milestones])

  const addMilestone = () => {
    if (!name || !date) return
    setMilestones(prev => [...prev, { id: Date.now().toString(), name, date, achieved: false }])
    setName('')
    setDate('')
  }

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, achieved: !m.achieved } : m))
  }

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id))
  }

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Milestones', '='.repeat(50), `Total: ${milestones.length}`, `Achieved: ${milestones.filter(m => m.achieved).length}`, '', ...milestones.map((m, i) => `${i+1}. ${m.name} - ${m.date} (${m.achieved ? 'ACHIEVED' : 'PENDING'})`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'milestones.pdf'; a.click()
  }

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-pink-500" /> Milestones</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>

        <div className="flex gap-2 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border" placeholder="Milestone name" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2.5 rounded-xl border" />
          <button onClick={addMilestone} className="px-4 py-2.5 rounded-xl bg-pink-600 text-white"><Plus className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="flex justify-between items-center p-4 rounded-xl bg-white dark:bg-neutral-900 border">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleMilestone(m.id)} className={m.achieved ? 'text-green-500' : 'text-neutral-400'}>
                  {m.achieved ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div>
                  <p className={`font-medium ${m.achieved ? 'line-through' : ''}`}>{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.date}</p>
                </div>
              </div>
              <button onClick={() => deleteMilestone(m.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {milestones.length === 0 && <p className="text-center py-8 text-muted-foreground">No milestones</p>}
        </div>
      </main>
    </div>
  )
}